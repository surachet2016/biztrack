import { Hono } from 'hono';
import { PACKAGES } from '@biztrack/shared/constants';

const payments = new Hono();

// POST /api/payments/upload-slip — user submits payment slip
payments.post('/upload-slip', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();
  const { plan, slip_base64, slip_mime } = body;

  if (!PACKAGES[plan]) return c.json({ error: 'Invalid plan' }, 400);
  if (!slip_base64) return c.json({ error: 'Slip image required' }, 400);

  // Upload slip to Supabase Storage
  const fileName = `slips/${user.id}/${Date.now()}.jpg`;
  const slipBuffer = Uint8Array.from(atob(slip_base64.replace(/^data:.*?;base64,/, '')), (c) => c.charCodeAt(0));

  const { error: uploadError } = await supabase.storage
    .from('payment-slips')
    .upload(fileName, slipBuffer, { contentType: slip_mime || 'image/jpeg' });

  if (uploadError) return c.json({ error: uploadError.message }, 400);

  const { data: { publicUrl } } = supabase.storage
    .from('payment-slips')
    .getPublicUrl(fileName);

  // Create payment record
  const { data, error } = await supabase
    .from('payment_slips')
    .insert({
      user_id: user.id,
      plan,
      amount: PACKAGES[plan].price,
      slip_url: publicUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ payment: data, message: 'สลิปได้รับแล้ว รอการตรวจสอบจาก Admin' });
});

// GET /api/payments/my — current user's payment history
payments.get('/my', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('payment_slips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ payments: data });
});

// GET /api/payments — admin: list all payments
payments.get('/', async (c) => {
  const supabase = c.get('supabase');
  const status = c.req.query('status');

  let query = supabase
    .from('payment_slips')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ payments: data });
});

// PATCH /api/payments/:id — admin: approve/reject
payments.patch('/:id', async (c) => {
  const supabase = c.get('supabase');
  const profile = c.get('profile');
  const id = c.req.param('id');
  const { status, note } = await c.req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return c.json({ error: 'Status must be approved or rejected' }, 400);
  }

  // Update payment
  const { data: payment, error } = await supabase
    .from('payment_slips')
    .update({ status, note, reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);

  // If approved → create/extend subscription
  if (status === 'approved') {
    const pkg = PACKAGES[payment.plan];
    const now = new Date();
    const expiresAt = new Date(now);
    if (pkg.period === 'month') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (pkg.period === 'year') expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await supabase.from('subscriptions').upsert({
      user_id: payment.user_id,
      plan: payment.plan,
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'user_id' });
  }

  return c.json({ payment, message: status === 'approved' ? 'อนุมัติแล้ว Subscription เปิดใช้งานแล้ว' : 'ปฏิเสธแล้ว' });
});

export default payments;
