import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware, adminMiddleware, requireSubscription } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import chatRoutes from './routes/chat.js';
import transactionRoutes from './routes/transactions.js';
import productRoutes from './routes/products.js';
import zakatRoutes from './routes/zakat.js';
import adminRoutes from './routes/admin.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', (c, next) => corsMiddleware(c.env)(c, next));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'BizTrack API', version: '1.0.0' }));

// Public settings (bank info for payment page) — auth required, not admin
app.use('/api/settings', authMiddleware);
app.get('/api/settings', async (c) => {
  const supabase = c.get('supabase');
  const { data } = await supabase.from('site_settings').select('*');
  const settings = (data || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  return c.json({ settings });
});

// Auth routes (require token for profile/me, public for nothing here)
app.use('/api/auth/*', authMiddleware);
app.route('/api/auth', authRoutes);

// Subscription routes
app.use('/api/subscriptions/*', authMiddleware);
app.route('/api/subscriptions', subscriptionRoutes);

// Payment routes — user upload + admin management
app.use('/api/payments/*', authMiddleware);
app.route('/api/payments', paymentRoutes);

// Chat routes — require active subscription
app.use('/api/chat/*', authMiddleware, requireSubscription);
app.route('/api/chat', chatRoutes);

// Transaction routes — require active subscription
app.use('/api/transactions/*', authMiddleware, requireSubscription);
app.route('/api/transactions', transactionRoutes);

// Product routes — require active subscription
app.use('/api/products/*', authMiddleware, requireSubscription);
app.route('/api/products', productRoutes);

// Zakat routes — require subscription
app.use('/api/zakat/*', authMiddleware, requireSubscription);
app.route('/api/zakat', zakatRoutes);

// Admin routes — require auth + admin role
app.use('/api/admin/*', authMiddleware, adminMiddleware);
app.route('/api/admin', adminRoutes);

// 404
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
