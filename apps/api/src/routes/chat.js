import { Hono } from 'hono';
import { getPlanLimits } from '@biztrack/shared/utils';

const chat = new Hono();

const SYSTEM_PROMPT = `คุณคือผู้ช่วยการเงินและธุรกิจสำหรับผู้ประกอบการขนาดเล็กในประเทศไทย
ชื่อของคุณคือ "BizAI"

หน้าที่หลักของคุณ:
1. วิเคราะห์ข้อมูลรายรับและรายจ่ายจากใบเสร็จ ข้อความ หรือเสียงพูด
2. แนะนำการบริหารสินค้าและการขาย
3. คำนวณและเตือนเรื่อง Zakat สำหรับผู้ใช้มุสลิม
4. ตอบคำถามเกี่ยวกับธุรกิจ

เมื่อพบข้อมูลรายรับหรือรายจ่าย ให้ตอบในรูปแบบ JSON ที่ท้ายข้อความดังนี้:
[EXTRACT:{"type":"income"|"expense","amount":0,"description":"","category":""}]

ตอบเป็นภาษาไทย กระชับ เป็นมิตร และให้คำแนะนำที่เป็นประโยชน์`;

// POST /api/chat — send message to Claude
chat.post('/', async (c) => {
  const user = c.get('user');
  const subscription = c.get('subscription');
  const supabase = c.get('supabase');
  const body = await c.req.json();
  const { content, type = 'text', attachment_url, slow_moving_products } = body;

  // Check plan limits
  const limits = getPlanLimits(subscription?.plan);

  if (type === 'voice' && !limits.voice) {
    return c.json({
      error: 'แพ็กเกจฟรีไม่รองรับการส่งเสียง กรุณาอัปเกรดเป็นแพ็กเกจ Basic ขึ้นไป',
      code: 'PLAN_LIMIT'
    }, 403);
  }

  if (type === 'image' && !limits.image) {
    return c.json({
      error: 'แพ็กเกจของคุณไม่รองรับการส่งรูปภาพ กรุณาอัปเกรดเป็นแพ็กเกจ Pro',
      code: 'PLAN_LIMIT'
    }, 403);
  }

  // Build messages for Claude
  const userMessage = { role: 'user', content: [] };

  if (type === 'image' && attachment_url) {
    // Fetch image and convert to base64 for Claude
    userMessage.content.push({
      type: 'image',
      source: { type: 'url', url: attachment_url },
    });
    if (content) userMessage.content.push({ type: 'text', text: content });
    else userMessage.content.push({ type: 'text', text: 'กรุณาวิเคราะห์ใบเสร็จนี้ และแยกรายการรายรับ-รายจ่าย' });
  } else {
    userMessage.content = content;
  }

  // Append product alerts if any
  let systemPrompt = SYSTEM_PROMPT;
  if (slow_moving_products?.length) {
    const list = slow_moving_products.map(p => `- ${p.name} (${p.days_no_sale} วันไม่มีการขาย)`).join('\n');
    systemPrompt += `\n\nสินค้าที่ขายไม่ออกในระบบ:\n${list}\nกรุณาแจ้งเตือนเจ้าของร้านและให้คำแนะนำด้วย`;
  }

  // Call AI via OpenRouter (supports Claude, GPT, Gemini, etc.)
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (type === 'image' && attachment_url) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: attachment_url } },
        { type: 'text', text: content || 'วิเคราะห์ใบเสร็จนี้และแยกรายการรายรับ-รายจ่าย' },
      ],
    });
  } else {
    messages.push({ role: 'user', content });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${c.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': c.env.FRONTEND_URL || 'https://biztrack.pages.dev',
      'X-Title': 'BizTrack',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 1024,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return c.json({ error: 'AI service error', detail: err }, 502);
  }

  const aiData = await response.json();
  const assistantContent = aiData.choices?.[0]?.message?.content || '';

  // Save user message
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'user',
    content,
    type,
    attachment_url: attachment_url || null,
  });

  // Save assistant message
  const { data: savedMsg } = await supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'assistant',
    content: assistantContent,
    type: 'text',
  }).select().single();

  // Extract and save transactions if present
  const extractMatch = assistantContent.match(/\[EXTRACT:(.*?)\]/);
  let extractedTransaction = null;
  if (extractMatch && limits.receiptAnalysis) {
    try {
      const tx = JSON.parse(extractMatch[1]);
      const { data: txData } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category || 'ทั่วไป',
        source: type === 'image' ? 'upload' : type === 'voice' ? 'voice' : 'chat',
        receipt_url: attachment_url || null,
        date: new Date().toISOString().split('T')[0],
      }).select().single();
      extractedTransaction = txData;
    } catch (e) {
      // Ignore parse errors
    }
  }

  return c.json({
    message: savedMsg,
    extracted_transaction: extractedTransaction,
    clean_content: assistantContent.replace(/\[EXTRACT:.*?\]/g, '').trim(),
  });
});

// GET /api/chat/history
chat.get('/history', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const page = parseInt(c.req.query('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ messages: data, total: count, page });
});

// DELETE /api/chat/:id
chat.delete('/:id', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const id = c.req.param('id');

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});

export default chat;
