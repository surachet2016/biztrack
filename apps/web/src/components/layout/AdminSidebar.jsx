import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { signOut } from '@/lib/auth-store.js';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const ADMIN_NAV = [
  { to: '/admin/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'ผู้ใช้', icon: Users },
  { to: '/admin/payments', label: 'ชำระเงิน', icon: CreditCard },
  { to: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function AdminSidebar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/login', replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 flex flex-col z-40">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-400" />
          <span className="font-bold text-white text-lg">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ADMIN_NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === to || pathname === '/admin'
            : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                active ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition mt-4">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
