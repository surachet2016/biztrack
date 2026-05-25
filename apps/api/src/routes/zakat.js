import { Hono } from 'hono';
import { ZAKAT_RATE } from '@biztrack/shared/constants';

const zakat = new Hono();

// GET /api/zakat/calculate — calculate zakat from annual transactions
zakat.get('/calculate', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const year = c.req.query('year') || new Date().getFullYear().toString();

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  // Get annual income
  const { data: incomeData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'income')
    .gte('date', from)
    .lte('date', to);

  const totalIncome = (incomeData || []).reduce((s, t) => s + t.amount, 0);

  // Get nisab value from site settings
  const { data: nisabSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'zakat_nisab_thb')
    .single();

  const nisabTHB = parseFloat(nisabSetting?.value || '20000');
  const eligible = totalIncome >= nisabTHB;
  const zakatAmount = eligible ? totalIncome * ZAKAT_RATE : 0;

  return c.json({
    year,
    total_income: totalIncome,
    nisab_thb: nisabTHB,
    eligible,
    zakat_amount: zakatAmount,
    rate: ZAKAT_RATE,
  });
});

// POST /api/zakat/record — save zakat payment record
zakat.post('/record', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('zakat_records')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ record: data }, 201);
});

// GET /api/zakat/history
zakat.get('/history', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('zakat_records')
    .select('*')
    .eq('user_id', user.id)
    .order('year', { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ records: data });
});

export default zakat;
