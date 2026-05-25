// Local development server using Node.js (instead of wrangler)
// Used when macOS < 13.5 (Cloudflare Workers runtime not supported)
import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { serve } from '@hono/node-server';
import { WebSocket } from 'ws';
import app from './index.js';

// Node.js 20 doesn't have native WebSocket — polyfill for Supabase Realtime
if (!global.WebSocket) {
  global.WebSocket = WebSocket;
}

// Load .dev.vars (wrangler format) into process.env
try {
  const devVars = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf-8');
  devVars.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  });
  console.log('✅ Loaded .dev.vars');
} catch {
  console.log('⚠️  No .dev.vars found, using process.env');
}

// Cloudflare Workers env → Node.js: patch app to use process.env
// Hono with Node adapter passes env via different mechanism
const PORT = 8787;

serve({
  fetch: (req) => {
    // Inject env bindings for Cloudflare Workers compatibility
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      ENVIRONMENT: 'development',
    };
    return app.fetch(req, env);
  },
  port: PORT,
});

console.log(`🚀 BizTrack API running at http://localhost:${PORT}`);
