import { supabase } from './supabase.js';
import { api } from './api.js';

// Simple reactive auth store
let _user = null;
let _profile = null;
let _subscription = null;
let _listeners = [];

function notify() {
  _listeners.forEach((fn) => fn({ user: _user, profile: _profile, subscription: _subscription }));
}

export function subscribeAuth(fn) {
  _listeners.push(fn);
  fn({ user: _user, profile: _profile, subscription: _subscription });
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
}

export function getAuth() {
  return { user: _user, profile: _profile, subscription: _subscription };
}

// Initialize on app load
supabase.auth.onAuthStateChange(async (event, session) => {
  _user = session?.user || null;
  if (_user) {
    try {
      // For OAuth logins (Google), auto-create profile on first sign-in
      if (event === 'SIGNED_IN') {
        await api.post('/api/auth/profile', {
          name: _user.user_metadata?.full_name || _user.user_metadata?.name || '',
          avatar_url: _user.user_metadata?.avatar_url || '',
        });
      }
      const data = await api.get('/api/auth/me');
      _profile = data.profile;
      _subscription = data.subscription;
    } catch {
      _profile = null;
      _subscription = null;
    }
  } else {
    _profile = null;
    _subscription = null;
  }
  notify();
});

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  // Create profile via API
  if (data.user) {
    await api.post('/api/auth/profile', { name });
  }
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function refreshProfile() {
  if (!_user) return;
  const data = await api.get('/api/auth/me');
  _profile = data.profile;
  _subscription = data.subscription;
  notify();
}
