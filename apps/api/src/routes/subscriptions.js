import { Hono } from 'hono';

const subscriptions = new Hono();

// GET /api/subscriptions/me
subscriptions.get('/me', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return c.json({ error: error.message }, 400);
  }
  return c.json({ subscription: data || null });
});

export default subscriptions;
