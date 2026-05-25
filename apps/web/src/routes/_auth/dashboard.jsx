import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth.js';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { TrendingUp, TrendingDown, Package, MessageCircle, CreditCard, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, subscription } = useAuth();

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => api.get('/api/transactions?page=1'),
    enabled: !!subscription,
  });

  const { data: alertData } = useQuery({
    queryKey: ['product-alerts'],
    queryFn: () => api.get('/api/products/alerts'),
    enabled: !!subscription,
  });

  const income = txData?.totals?.income || 0;
  const expense = txData?.totals?.expense || 0;
  const net = income - expense;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          สวัสดี, {profile?.name || 'ผู้ใช้'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">ภาพรวมธุรกิจของคุณวันนี้</p>
      </div>

      {/* Subscription Banner */}
      {!subscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800 text-sm">ยังไม่มีแพ็กเกจ</p>
              <p className="text-amber-600 text-xs">สมัครแพ็กเกจเพื่อใช้งาน AI Chat และฟีเจอร์ทั้งหมด</p>
            </div>
          </div>
          <Link to="/subscription" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
            ดูแพ็กเกจ
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="รายรับ" value={formatBaht(income)} color="green" />
        <StatCard icon={TrendingDown} label="รายจ่าย" value={formatBaht(expense)} color="red" />
        <StatCard icon={Package} label="กำไรสุทธิ" value={formatBaht(net)} color={net >= 0 ? 'green' : 'red'} />
        <StatCard icon={AlertTriangle} label="สินค้าขายไม่ออก" value={alertData?.alerts?.length || 0} color="amber" suffix="รายการ" />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" /> เริ่มแชทกับ AI
          </h2>
          <p className="text-gray-500 text-sm mb-4">ส่งข้อความ เสียง หรือรูปใบเสร็จ เพื่อวิเคราะห์รายรับ-รายจ่าย</p>
          <Link to="/chat" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition inline-block">
            เปิด Chat →
          </Link>
        </div>

        {alertData?.alerts?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h2 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> สินค้าที่ต้องระวัง
            </h2>
            <ul className="space-y-2">
              {alertData.alerts.slice(0, 3).map((p) => (
                <li key={p.id} className="text-sm text-amber-700 flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-amber-500">{p.days_no_sale ? `${p.days_no_sale} วัน` : 'ไม่เคยขาย'}</span>
                </li>
              ))}
            </ul>
            <Link to="/products" className="text-amber-600 text-xs hover:underline mt-2 inline-block">
              ดูทั้งหมด →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, suffix }) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    amber: 'bg-amber-50 text-amber-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
        {value}{suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
