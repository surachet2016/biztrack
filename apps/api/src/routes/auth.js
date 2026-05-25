import { Hono } from 'hono';

const auth = new Hono();

// POST /api/auth/profile — upsert profile after Supabase sign-up
auth.post('/profile', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      name: body.name || user.user_metadata?.full_name || '',
      role: 'user',
      avatar_url: body.avatar_url || '',
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);

  // Auto-create free subscription for new users (if none exists)
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!existingSub) {
    // 30-day free trial for new users
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: 'free',
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiry.toISOString(),
    });
  }

  return c.json({ profile: data });
});

// GET /api/auth/me — get current user profile
auth.get('/me', async (c) => {
  const user = c.get('user');
  const profile = c.get('profile');
  const supabase = c.get('supabase');

  // Get active subscription (including free plan)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return c.json({ user, profile, subscription: subscription || null });
});

export default auth;
