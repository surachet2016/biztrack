import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth.js';
import { api } from '@/lib/api.js';
import { PACKAGES } from '@biztrack/shared/constants';
import { formatBaht } from '@biztrack/shared/utils';
import { CheckCircle, Upload, Clock } from 'lucide-react';

export const Route = createFileRoute('/_auth/subscription')({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { subscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState('select'); // select | payment | submitted
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const fileRef = useRef();

  const { data: settingsData } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/api/admin/settings'),
  });

  const settings = settingsData?.settings || {};

  const { data: myPayments } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/api/payments/my'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const data = await api.post('/api/payments/upload-slip', {
              plan: selectedPlan,
              slip_base64: e.target.result,
              slip_mime: slipFile.type,
            });
            resolve(data);
          } catch (err) { reject(err); }
        };
        reader.readAsDataURL(slipFile);
      });
    },
    onSuccess: () => setStep('submitted'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แพ็กเกจและการชำระเงิน</h1>

      {subscription && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">แพ็กเกจปัจจุบัน: {PACKAGES[subscription.plan]?.nameTh}</p>
            <p className="text-green-600 text-xs">หมดอายุ: {new Date(subscription.expires_at).toLocaleDateString('th-TH')}</p>
          </div>
        </div>
      )}

      {step === 'select' && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {Object.values(PACKAGES).map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPlan(pkg.id)}
              className={`rounded-2xl p-5 border-2 cursor-pointer transition ${selectedPlan === pkg.id ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}`}
            >
              <h3 className="font-bold text-gray-800">{pkg.nameTh}</h3>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-2xl font-bold text-green-600">{formatBaht(pkg.price)}</span>
                <span className="text-gray-400 text-xs">/{pkg.periodTh}</span>
              </div>
              <ul className="space-y-1">
                {pkg.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {step === 'select' && selectedPlan && (
        <button
          onClick={() => setStep('payment')}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition"
        >
          ดำเนินการชำระเงิน →
        </button>
      )}

      {step === 'payment' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">ข้อมูลการโอนเงิน</h2>
          <div className="bg-green-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
            <p><span className="text-gray-500">ธนาคาร:</span> <span className="font-medium text-gray-800">{settings.bank_name || '-'}</span></p>
            <p><span className="text-gray-500">เลขบัญชี:</span> <span className="font-mono font-bold text-gray-800 text-base">{settings.bank_account_number || '-'}</span></p>
            <p><span className="text-gray-500">ชื่อบัญชี:</span> <span className="font-medium text-gray-800">{settings.bank_account_name || '-'}</span></p>
            <p><span className="text-gray-500">จำนวนเงิน:</span> <span className="font-bold text-green-600 text-base">{formatBaht(PACKAGES[selectedPlan]?.price)}</span></p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">แนบสลิปการโอนเงิน</label>
            {slipPreview ? (
              <div className="relative inline-block">
                <img src={slipPreview} alt="slip" className="h-40 rounded-xl border border-gray-200 object-contain" />
                <button onClick={() => { setSlipFile(null); setSlipPreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center">×</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-green-200 rounded-xl p-8 w-full flex flex-col items-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 transition"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">คลิกเพื่ออัปโหลดสลิป</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {uploadMutation.isError && (
            <p className="text-red-500 text-sm mb-3">{uploadMutation.error?.message}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('select')} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">ย้อนกลับ</button>
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={!slipFile || uploadMutation.isPending}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'กำลังส่ง...' : 'ส่งสลิปการโอนเงิน'}
            </button>
          </div>
        </div>
      )}

      {step === 'submitted' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">📨</div>
          <h2 className="font-bold text-xl text-gray-800 mb-2">รับสลิปแล้ว!</h2>
          <p className="text-gray-500 text-sm mb-4">ทีมงานจะตรวจสอบและเปิดใช้งานแพ็กเกจภายใน 24 ชั่วโมง</p>
          <button onClick={() => setStep('select')} className="text-green-600 text-sm hover:underline">กลับไปเลือกแพ็กเกจ</button>
        </div>
      )}

      {/* Payment History */}
      {myPayments?.payments?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-800 mb-3">ประวัติการชำระเงิน</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">แพ็กเกจ</th>
                  <th className="px-4 py-3 text-left">จำนวน</th>
                  <th className="px-4 py-3 text-left">สถานะ</th>
                  <th className="px-4 py-3 text-left">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myPayments.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{PACKAGES[p.plan]?.nameTh || p.plan}</td>
                    <td className="px-4 py-3 font-medium">{formatBaht(p.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'รอตรวจสอบ', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'อนุมัติแล้ว', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'ปฏิเสธ', cls: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
