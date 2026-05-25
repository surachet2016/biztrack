import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth.js';
import AdminSidebar from '@/components/layout/AdminSidebar.jsx';
import { supabase } from '@/lib/supabase.js';
import { api } from '@/lib/api.js';

export const Route = createFileRoute('/_admin')({
  beforeLoad: async () => {
    // Check session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/login' });

    // Fetch profile to check role
    try {
      const data = await api.get('/api/auth/me');
      if (data?.profile?.role !== 'admin') throw redirect({ to: '/dashboard' });
    } catch (e) {
      if (e?.isRedirect) throw e;
      throw redirect({ to: '/dashboard' });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-green-50"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
