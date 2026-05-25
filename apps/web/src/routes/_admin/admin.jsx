import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { Users, CreditCard, TrendingUp, Package } from 'lucide-react';

export const Route = createFileRoute('/_admin/admin')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const stats = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛠 Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={stats.total_users || 0} color="green" />
        <StatCard icon={CreditCard} label="Subscription ที่ใช้งาน" value={stats.active_subscriptions || 0} color="blue" />
        <StatCard icon={TrendingUp} label="รายได้รวม" value={formatBaht(stats.total_revenue || 0)} color="green" />
        <StatCard icon={Package} label="Basic / Pro / Annual" value={`${stats.subscriptions_by_plan?.basic || 0} / ${stats.subscriptions_by_plan?.pro || 0} / ${stats.subscriptions_by_plan?.annual || 0}`} color="purple" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-500', purple: 'bg-purple-50 text-purple-500' };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
