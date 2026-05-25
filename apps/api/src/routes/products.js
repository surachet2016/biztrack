import { Hono } from 'hono';
import { SLOW_MOVING_DAYS } from '@biztrack/shared/constants';

const products = new Hono();

// GET /api/products
products.get('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ products: data });
});

// GET /api/products/alerts — slow-moving products
products.get('/alerts', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - SLOW_MOVING_DAYS);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .gt('stock_qty', 0)
    .or(`last_sold_at.is.null,last_sold_at.lt.${threshold.toISOString()}`);

  if (error) return c.json({ error: error.message }, 400);

  const alerts = (data || []).map((p) => ({
    ...p,
    days_no_sale: p.last_sold_at
      ? Math.floor((Date.now() - new Date(p.last_sold_at)) / 86400000)
      : null,
  }));

  return c.json({ alerts });
});

// GET /api/products/recommend — AI sales recommendations
products.get('/recommend', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  // Get slow-moving products
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - SLOW_MOVING_DAYS);

  const { data: slowProducts } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .gt('stock_qty', 0)
    .or(`last_sold_at.is.null,last_sold_at.lt.${threshold.toISOString()}`)
    .limit(10);

  if (!slowProducts?.length) {
    return c.json({ recommendations: [], message: 'ยังไม่มีสินค้าที่ต้องการคำแนะนำ' });
  }

  const productList = slowProducts.map(p =>
    `${p.name} (ราคา ${p.price} บาท, stock ${p.stock_qty} ชิ้น, ไม่มีการขาย ${p.days_no_sale || '?'} วัน)`
  ).join('\n');

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
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'คุณคือที่ปรึกษาธุรกิจสำหรับร้านค้าขนาดเล็กในประเทศไทย' },
        {
          role: 'user',
          content: `สินค้าต่อไปนี้ขายไม่ค่อยได้:\n${productList}\n\nกรุณาให้คำแนะนำการขายที่เป็นประโยชน์ เช่น การตั้งราคา โปรโมชั่น หรือการจัดแสดงสินค้า ตอบเป็นภาษาไทย`,
        },
      ],
    }),
  });

  const aiData = await response.json();
  const recommendations = aiData.choices?.[0]?.message?.content || '';

  return c.json({ recommendations, slow_products: slowProducts });
});

// POST /api/products
products.post('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('products')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ product: data }, 201);
});

// PATCH /api/products/:id
products.patch('/:id', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ product: data });
});

// DELETE /api/products/:id
products.delete('/:id', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const id = c.req.param('id');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});

export default products;
