import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { Users, CreditCard, TrendingUp, Package, Download } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export const Route = createFileRoute('/_admin/admin')({
  component: AdminDashboard,
});

const PLAN_COLORS = {
  free:   '#94a3b8',
  basic:  '#34d399',
  pro:    '#10b981',
  annual: '#059669',
};
const PLAN_LABELS = { free: 'ฟรี', basic: 'Basic', pro: 'Pro', annual: 'Annual' };

const STATUS_COLORS = { pending: '#fbbf24', approved: '#10b981', rejected: '#f87171' };
const STATUS_LABELS = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' };

function exportCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Thai
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats'),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users'),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['admin-payments-all'],
    queryFn: () => api.get('/api/payments?status=approved'),
  });

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = data || {};

  // Pie chart data for subscriptions by plan
  const planPieData = Object.entries(stats.subscriptions_by_plan || {})
    .filter(([, v]) => v > 0)
    .map(([plan, count]) => ({ name: PLAN_LABELS[plan] || plan, value: count, plan }));

  // Pie chart data for payment status
  const paymentPieData = Object.entries(stats.payment_status || {})
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count, status }));

  // CSV export helpers
  const handleExportUsers = () => {
    const rows = (usersData?.users || []).map(u => ({
      ชื่อ: u.name || '',
      Email: u.email || '',
      บทบาท: u.role || '',
      แพ็กเกจ: u.subscriptions?.[0]?.plan || 'ไม่มี',
      สถานะ: u.subscriptions?.[0]?.status || '',
      วันสมัคร: new Date(u.created_at).toLocaleDateString('th-TH'),
    }));
    exportCSV(rows, `biztrack-users-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportRevenue = () => {
    const rows = (stats.monthly_revenue || []).map(m => ({
      เดือน: m.month,
      รายได้: m.revenue,
    }));
    exportCSV(rows, `biztrack-revenue-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleExportPayments = () => {
    const rows = (paymentsData?.payments || []).map(p => ({
      ชื่อ: p.profiles?.name || '',
      Email: p.profiles?.email || '',
      แพ็กเกจ: p.plan || '',
      จำนวน: p.amount || 0,
      สถานะ: p.status || '',
      วันที่: new Date(p.created_at).toLocaleDateString('th-TH'),
    }));
    exportCSV(rows, `biztrack-payments-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🛠 Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={handleExportUsers} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs hover:bg-gray-50 transition">
            <Download className="w-3.5 h-3.5" /> Export Users
          </button>
          <button onClick={handleExportRevenue} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs hover:bg-gray-50 transition">
            <Download className="w-3.5 h-3.5" /> Export Revenue
          </button>
          <button onClick={handleExportPayments} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs hover:bg-gray-50 transition">
            <Download className="w-3.5 h-3.5" /> Export Payments
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="ผู้ใช้ทั้งหมด"         value={stats.total_users || 0}              color="green" />
        <StatCard icon={CreditCard} label="Subscriptions ที่ใช้งาน" value={stats.active_subscriptions || 0}    color="blue" />
        <StatCard icon={TrendingUp} label="รายได้รวม"              value={formatBaht(stats.total_revenue || 0)} color="green" />
        <StatCard icon={Package}    label="Basic / Pro / Annual"    value={`${stats.subscriptions_by_plan?.basic||0} / ${stats.subscriptions_by_plan?.pro||0} / ${stats.subscriptions_by_plan?.annual||0}`} color="purple" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm">รายได้รายเดือน (6 เดือนล่าสุด)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthly_revenue || []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `฿${v.toLocaleString()}`} />
              <Tooltip formatter={(v) => [`฿${Number(v).toLocaleString()}`, 'รายได้']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-sm mb-4">ผู้ใช้ใหม่รายเดือน (6 เดือนล่าสุด)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.user_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'ผู้ใช้ใหม่']} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscriptions Pie */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-sm mb-4">สัดส่วน Subscriptions ตามแพ็กเกจ</h2>
          {planPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {planPieData.map((entry) => (
                    <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">ยังไม่มีข้อมูล Subscription</div>
          )}
        </div>

        {/* Payment Status Pie */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-sm mb-4">สถานะการชำระเงิน</h2>
          {paymentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {paymentPieData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">ยังไม่มีรายการชำระเงิน</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-500',
    purple: 'bg-purple-50 text-purple-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-1 truncate">{value}</p>
    </div>
  );
}
