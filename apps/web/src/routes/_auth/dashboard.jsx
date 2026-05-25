import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth.js';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { TrendingUp, TrendingDown, Package, MessageCircle, AlertTriangle, ArrowRight, Sparkles, Zap } from 'lucide-react';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'อรุณสวัสดิ์';
  if (h < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

function DashboardPage() {
  const { profile, subscription } = useAuth();
  const plan = subscription?.plan || 'free';
  const isPaid = ['basic', 'pro', 'annual'].includes(plan);

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => api.get('/api/transactions?page=1'),
  });

  const { data: alertData } = useQuery({
    queryKey: ['product-alerts'],
    queryFn: () => api.get('/api/products/alerts'),
  });

  const income = txData?.totals?.income || 0;
  const expense = txData?.totals?.expense || 0;
  const net = income - expense;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {profile?.name?.split(' ')[0] || 'ผู้ใช้'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">ภาพรวมธุรกิจของคุณวันนี้</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Free plan upgrade banner */}
      {plan === 'free' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
            <Zap className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="font-bold text-lg">อัปเกรดเพื่อปลดล็อคทุกฟีเจอร์</p>
              <p className="text-green-100 text-sm mt-1">เสียง • รูปใบเสร็จ • วิเคราะห์รายรับ-รายจ่าย</p>
            </div>
            <Link
              to="/subscription"
              className="bg-white text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition flex items-center gap-1.5 flex-shrink-0 ml-4"
            >
              ดูแพ็กเกจ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards — shown for all plans */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="รายรับ"
          value={formatBaht(income)}
          iconCls="bg-green-100 text-green-600"
          valueCls="text-green-600"
        />
        <StatCard
          icon={TrendingDown}
          label="รายจ่าย"
          value={formatBaht(expense)}
          iconCls="bg-red-50 text-red-500"
          valueCls="text-red-500"
        />
        <StatCard
          icon={Package}
          label="กำไรสุทธิ"
          value={formatBaht(net)}
          iconCls={net >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}
          valueCls={net >= 0 ? 'text-blue-600' : 'text-red-500'}
        />
        <StatCard
          icon={AlertTriangle}
          label="สินค้าขายไม่ออก"
          value={alertData?.alerts?.length || 0}
          suffix="รายการ"
          iconCls="bg-amber-50 text-amber-500"
          valueCls="text-amber-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/chat"
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 hover:border-green-200 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm shadow-green-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-gray-800">แชทกับ BizAI</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {plan === 'free'
              ? 'พิมพ์ข้อความถามเรื่องธุรกิจ บัญชี หรือการเงินได้เลย'
              : 'ส่งข้อความ เสียง หรือรูปใบเสร็จ เพื่อวิเคราะห์รายรับ-รายจ่าย'}
          </p>
          <span className="text-green-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            เปิด Chat <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {alertData?.alerts?.length > 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="font-bold text-amber-800">สินค้าที่ต้องระวัง</h2>
            </div>
            <ul className="space-y-2">
              {alertData.alerts.slice(0, 3).map((p) => (
                <li key={p.id} className="text-sm text-amber-700 flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-amber-400 text-xs">{p.days_no_sale ? `${p.days_no_sale} วัน` : 'ไม่เคยขาย'}</span>
                </li>
              ))}
            </ul>
            <Link to="/products" className="text-amber-600 text-xs hover:underline mt-3 inline-flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <Link
            to="/products"
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 hover:border-blue-200 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="font-bold text-gray-800">จัดการสินค้า</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">เพิ่ม แก้ไข หรือติดตามสต็อกสินค้าของคุณ</p>
            <span className="text-blue-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              ดูสินค้า <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        )}
      </div>

      {/* Recent activity */}
      {txData?.transactions?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-600" />
              รายการล่าสุด
            </h2>
          </div>
          <div className="space-y-2">
            {txData.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.category} • {new Date(tx.date).toLocaleDateString('th-TH')}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatBaht(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconCls, valueCls, suffix }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:shadow-md transition">
      <div className={`w-10 h-10 rounded-xl ${iconCls} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueCls || 'text-gray-800'}`}>
        {value}
        {suffix && <span className="text-sm font-normal ml-1 text-gray-400">{suffix}</span>}
      </p>
    </div>
  );
}
