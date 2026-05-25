import { Hono } from 'hono';

const admin = new Hono();

// GET /api/admin/users
admin.get('/users', async (c) => {
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('profiles')
    .select('*, subscriptions(plan, status, expires_at)')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ users: data });
});

// PATCH /api/admin/users/:id — change role
admin.patch('/users/:id', async (c) => {
  const supabase = c.get('supabase');
  const id = c.req.param('id');
  const { role } = await c.req.json();

  if (!['admin', 'user'].includes(role)) {
    return c.json({ error: 'Role must be admin or user' }, 400);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ profile: data });
});

// GET /api/admin/settings
admin.get('/settings', async (c) => {
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error) return c.json({ error: error.message }, 400);

  // Convert array to key-value object
  const settings = (data || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return c.json({ settings });
});

// PATCH /api/admin/settings
admin.patch('/settings', async (c) => {
  const supabase = c.get('supabase');
  const profile = c.get('profile');
  const body = await c.req.json();

  const updates = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
    updated_by: profile.id,
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(updates, { onConflict: 'key' });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, updated: Object.keys(body).length });
});

// DELETE /api/admin/users/:id — delete user profile
admin.delete('/users/:id', async (c) => {
  const supabase = c.get('supabase');
  const id = c.req.param('id');

  // Delete subscriptions first (FK constraint)
  await supabase.from('subscriptions').delete().eq('user_id', id);
  await supabase.from('transactions').delete().eq('user_id', id);
  await supabase.from('chat_messages').delete().eq('user_id', id);
  await supabase.from('products').delete().eq('user_id', id);

  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});

// GET /api/admin/stats — dashboard KPIs
admin.get('/stats', async (c) => {
  const supabase = c.get('supabase');

  const [usersRes, subsRes, paymentsRes, allPaymentsRes] = await Promise.all([
    supabase.from('profiles').select('id, created_at', { count: 'exact' }),
    supabase.from('subscriptions').select('plan, status').eq('status', 'active'),
    supabase.from('payment_slips').select('amount, status, created_at').eq('status', 'approved'),
    supabase.from('payment_slips').select('amount, status, created_at, plan'),
  ]);

  const totalRevenue = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
  const subsByPlan = (subsRes.data || []).reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] || 0) + 1;
    return acc;
  }, {});

  // Monthly revenue (last 6 months)
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = (paymentsRes.data || [])
      .filter(p => p.created_at?.startsWith(monthStr))
      .reduce((s, p) => s + Number(p.amount), 0);
    monthlyRevenue.push({ month: label, revenue: total });
  }

  // User growth (last 6 months)
  const userGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = (usersRes.data || [])
      .filter(u => u.created_at?.startsWith(monthStr)).length;
    userGrowth.push({ month: label, users: count });
  }

  // Payment status breakdown
  const paymentStatus = (allPaymentsRes.data || []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return c.json({
    total_users: usersRes.count || 0,
    active_subscriptions: subsRes.data?.length || 0,
    subscriptions_by_plan: subsByPlan,
    total_revenue: totalRevenue,
    monthly_revenue: monthlyRevenue,
    user_growth: userGrowth,
    payment_status: paymentStatus,
  });
});

export default admin;
