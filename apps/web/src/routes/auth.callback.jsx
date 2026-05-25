import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { Zap } from 'lucide-react';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const go = (to) => { if (!done) { done = true; navigate({ to, replace: true }); } };

    // Listen for session established by detectSessionInUrl
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) go('/dashboard');
      else if (event === 'SIGNED_OUT') go('/login');
    });

    // Fallback: session may already be set before useEffect ran
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go('/dashboard');
    });

    // Hard timeout
    const timeout = setTimeout(() => go('/login'), 10000);

    return () => { done = true; subscription.unsubscribe(); clearTimeout(timeout); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-4"
          style={{ border: '3px solid #22c55e', borderTopColor: 'transparent' }} />
        <p className="text-gray-700 font-semibold text-lg">กำลังเข้าสู่ระบบ</p>
        <p className="text-gray-400 text-sm mt-1">กำลังตรวจสอบ...</p>
      </div>
    </div>
  );
}
