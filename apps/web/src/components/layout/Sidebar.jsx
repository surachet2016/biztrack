import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth.js';
import { signOut } from '@/lib/auth-store.js';
import { LayoutDashboard, MessageCircle, Package, Star, CreditCard, LogOut, Zap, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const NAV = [
  { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Chat', icon: MessageCircle },
  { to: '/products', label: 'สินค้า', icon: Package },
  { to: '/zakat', label: 'Zakat', icon: Star },
  { to: '/subscription', label: 'แพ็กเกจ', icon: CreditCard },
];

const PLAN_BADGES = {
  free:   { label: 'ฟรี', cls: 'bg-gray-100 text-gray-500', emoji: '' },
  basic:  { label: 'Basic', cls: 'bg-green-100 text-green-700', emoji: '🌱' },
  pro:    { label: 'Pro', cls: 'bg-emerald-100 text-emerald-700', emoji: '⚡' },
  annual: { label: 'Annual', cls: 'bg-teal-100 text-teal-700', emoji: '🌟' },
};

export default function Sidebar() {
  const { profile, subscription } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/login', replace: true });
  };

  const plan = subscription?.plan || 'free';
  const badge = PLAN_BADGES[plan] || PLAN_BADGES.free;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-800 text-lg leading-none">BizTrack</span>
            <p className="text-xs text-gray-400 leading-none mt-0.5">ผู้ช่วยธุรกิจ AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm shadow-green-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}

        {profile?.role === 'admin' && (
          <Link
            to="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname.startsWith('/admin')
                ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-sm shadow-purple-200'
                : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
            )}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Plan upgrade prompt (free only) */}
      {plan === 'free' && (
        <div className="px-3 pb-2">
          <Link
            to="/subscription"
            className="block bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl px-3 py-3 hover:border-green-300 transition group"
          >
            <p className="text-xs font-semibold text-green-700 mb-0.5">อัปเกรดแพ็กเกจ</p>
            <p className="text-xs text-green-500 group-hover:text-green-600">ปลดล็อคเสียง & รูปภาพ →</p>
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* Plan badge */}
        <div className={cn('rounded-xl px-3 py-2 mb-3 flex items-center justify-between', badge.cls)}>
          <span className="text-xs font-semibold">
            {badge.emoji && `${badge.emoji} `}{badge.label}
          </span>
          <span className="text-xs opacity-70">
            {plan === 'free' ? 'แพ็กเกจฟรี' : 'Active'}
          </span>
        </div>

        <div className="flex items-center gap-3 px-1 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{profile?.name || 'ผู้ใช้'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
