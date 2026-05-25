import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { PACKAGES } from '@biztrack/shared/constants';
import { formatBaht } from '@biztrack/shared/utils';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export const Route = createFileRoute('/_admin/admin/payments')({
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [viewSlip, setViewSlip] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', filter],
    queryFn: () => api.get(`/api/payments?status=${filter}`),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }) => api.patch(`/api/payments/${id}`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      setViewSlip(null);
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💳 ตรวจสอบการชำระเงิน</h1>

      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === s ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s === 'pending' ? 'รอตรวจสอบ' : s === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
          </button>
        ))}
      </div>

      {/* Slip viewer modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-gray-800 mb-3">สลิปการโอนเงิน</h2>
            <img src={viewSlip.slip_url} alt="slip" className="w-full rounded-xl border border-gray-200 mb-4 max-h-80 object-contain" />
            <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4">
              <p><span className="text-gray-500">ผู้ใช้:</span> <span className="font-medium">{viewSlip.profiles?.name}</span></p>
              <p><span className="text-gray-500">Email:</span> {viewSlip.profiles?.email}</p>
              <p><span className="text-gray-500">แพ็กเกจ:</span> {PACKAGES[viewSlip.plan]?.nameTh}</p>
              <p><span className="text-gray-500">จำนวน:</span> <span className="font-bold text-green-600">{formatBaht(viewSlip.amount)}</span></p>
            </div>
            {viewSlip.status === 'pending' && (
              <>
                <textarea
                  placeholder="หมายเหตุ (สำหรับการปฏิเสธ)"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-3 resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => reviewMutation.mutate({ id: viewSlip.id, status: 'approved' })}
                    disabled={reviewMutation.isPending}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> อนุมัติ
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: viewSlip.id, status: 'rejected', note: rejectNote })}
                    disabled={reviewMutation.isPending}
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600 transition"
                  >
                    <XCircle className="w-4 h-4" /> ปฏิเสธ
                  </button>
                </div>
              </>
            )}
            <button onClick={() => setViewSlip(null)} className="w-full mt-2 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">ปิด</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">ผู้ใช้</th>
                <th className="px-5 py-3 text-left">แพ็กเกจ</th>
                <th className="px-5 py-3 text-left">จำนวน</th>
                <th className="px-5 py-3 text-left">วันที่</th>
                <th className="px-5 py-3 text-left">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.payments || []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{p.profiles?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{p.profiles?.email}</p>
                  </td>
                  <td className="px-5 py-3">{PACKAGES[p.plan]?.nameTh}</td>
                  <td className="px-5 py-3 font-bold text-green-600">{formatBaht(p.amount)}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('th-TH')}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => { setViewSlip(p); setRejectNote(''); }} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                      <Eye className="w-3 h-3" /> ดูสลิป
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && data?.payments?.length === 0 && (
          <div className="text-center py-10 text-gray-400">ไม่มีรายการ</div>
        )}
      </div>
    </div>
  );
}
