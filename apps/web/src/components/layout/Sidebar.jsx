import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth.js';
import { signOut } from '@/lib/auth-store.js';
import { LayoutDashboard, MessageCircle, Package, Star, CreditCard, Settings, LogOut, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const NAV = [
  { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Chat', icon: MessageCircle },
  { to: '/products', label: 'สินค้า', icon: Package },
  { to: '/zakat', label: 'Zakat', icon: Star },
  { to: '/subscription', label: 'แพ็กเกจ', icon: CreditCard },
];

export default function Sidebar() {
  const { profile, subscription } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-green-100 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-green-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-green-700 text-lg">BizTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
              pathname === to || pathname.startsWith(to + '/')
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        {profile?.role === 'admin' && (
          <Link
            to="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
              pathname.startsWith('/admin')
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
            )}
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-green-100">
        {subscription && (
          <div className="bg-green-50 rounded-xl px-3 py-2 mb-3 text-xs">
            <span className="text-green-600 font-medium">
              {subscription.plan === 'basic' ? '🌱 Basic' : subscription.plan === 'pro' ? '⚡ Pro' : '🌟 Annual'}
            </span>
            <span className="text-green-500 ml-1">• Active</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-1 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{profile?.name || 'ผู้ใช้'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
