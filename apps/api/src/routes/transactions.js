import { Hono } from 'hono';

const transactions = new Hono();

// GET /api/transactions
transactions.get('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const { type, from, to, page = '1' } = c.req.query();
  const limit = 50;
  const offset = (parseInt(page) - 1) * limit;

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error, count } = await query;
  if (error) return c.json({ error: error.message }, 400);

  const totals = data?.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
    return acc;
  }, {});

  return c.json({ transactions: data, total: count, totals, page: parseInt(page) });
});

// POST /api/transactions
transactions.post('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...body, user_id: user.id, source: 'manual' })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ transaction: data }, 201);
});

// DELETE /api/transactions/:id
transactions.delete('/:id', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const id = c.req.param('id');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});

export default transactions;
