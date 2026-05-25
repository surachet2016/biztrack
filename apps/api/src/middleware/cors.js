import { cors } from 'hono/cors';

export function corsMiddleware(env) {
  const allowed = [
    'http://localhost:5173',
    'https://biztrack.pages.dev',
    env.FRONTEND_URL,
  ].filter(Boolean);

  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0]),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}
