import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth.js';
import Sidebar from '@/components/layout/Sidebar.jsx';
import { getAuth } from '@/lib/auth-store.js';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { user } = getAuth();
    if (!user) throw redirect({ to: '/login' });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
