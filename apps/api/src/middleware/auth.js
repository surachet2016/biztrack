import { createClient } from '@supabase/supabase-js';

/**
 * Verify Supabase JWT and attach user to context
 * Usage: app.use('/api/*', authMiddleware)
 */
export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Fetch profile for role info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  c.set('user', user);
  c.set('profile', profile);
  c.set('supabase', supabase);

  await next();
}

/**
 * Require admin role
 */
export async function adminMiddleware(c, next) {
  const profile = c.get('profile');
  if (profile?.role !== 'admin') {
    return c.json({ error: 'Forbidden — Admin only' }, 403);
  }
  await next();
}

/**
 * Require active subscription (plan: any, including free)
 * Auto-creates free subscription if user has none
 */
export async function requireSubscription(c, next) {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const findActiveSub = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  };

  let sub = await findActiveSub();

  if (!sub) {
    // Auto-create 30-day free trial (ignore insert error from race condition)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: 'free',
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiry.toISOString(),
    });
    // Re-query — works even if insert failed due to race (another request already created it)
    sub = await findActiveSub();
  }

  if (!sub) {
    return c.json({ error: 'No active subscription', code: 'NO_SUBSCRIPTION' }, 403);
  }

  c.set('subscription', sub);
  await next();
}
