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
  return c.json({ profile: data });
});

// GET /api/auth/me — get current user profile
auth.get('/me', async (c) => {
  const user = c.get('user');
  const profile = c.get('profile');
  const supabase = c.get('supabase');

  // Get active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .single();

  return c.json({ user, profile, subscription: subscription || null });
});

export default auth;
