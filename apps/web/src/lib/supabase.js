import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    // Safari has a bug with navigator.locks that causes initializePromise to hang.
    // Bypass it with a simple no-lock implementation (safe for single-tab apps).
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
});

/**
 * Get the current session's access token for API calls
 */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
