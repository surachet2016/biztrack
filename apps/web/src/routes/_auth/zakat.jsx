import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { Star, CheckCircle, Calculator } from 'lucide-react';

export const Route = createFileRoute('/_auth/zakat')({
  component: ZakatPage,
});

function ZakatPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['zakat', year],
    queryFn: () => api.get(`/api/zakat/calculate?year=${year}`),
  });

  const { data: historyData } = useQuery({
    queryKey: ['zakat-history'],
    queryFn: () => api.get('/api/zakat/history'),
  });

  const recordMutation = useMutation({
    mutationFn: () => api.post('/api/zakat/record', {
      year: parseInt(year),
      total_assets: data.total_income,
      nisab_value: data.nisab_thb,
      zakat_amount: data.zakat_amount,
      is_paid: true,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zakat-history'] }),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">คำนวณ Zakat</h1>
          <p className="text-gray-400 text-sm">คำนวณจากรายได้ประจำปีในระบบ</p>
        </div>
      </div>

      {/* Year selector */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">ปี (พ.ศ.)</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y + 543} ({y})</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-6 text-gray-400">กำลังคำนวณ...</div>
        ) : data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">รายได้รวม</p>
                <p className="text-xl font-bold text-green-700">{formatBaht(data.total_income)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Nisab (ขั้นต่ำ)</p>
                <p className="text-xl font-bold text-gray-700">{formatBaht(data.nisab_thb)}</p>
              </div>
            </div>

            {data.eligible ? (
              <div className="bg-green-600 text-white rounded-xl p-5 text-center">
                <p className="text-sm opacity-90 mb-1">Zakat ที่ต้องจ่าย (2.5%)</p>
                <p className="text-3xl font-bold">{formatBaht(data.zakat_amount)}</p>
                <p className="text-xs opacity-75 mt-1">รายได้ {formatBaht(data.total_income)} × 2.5%</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <p className="text-gray-500 text-sm">รายได้ยังไม่ถึงเกณฑ์ Nisab ({formatBaht(data.nisab_thb)})</p>
                <p className="text-gray-400 text-xs mt-1">ยังไม่ต้องจ่าย Zakat ในปีนี้</p>
              </div>
            )}

            {data.eligible && (
              <button
                onClick={() => recordMutation.mutate()}
                disabled={recordMutation.isPending}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {recordMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการจ่าย Zakat'}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Zakat History */}
      {historyData?.records?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-sm">ประวัติการจ่าย Zakat</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">ปี</th>
                <th className="px-5 py-3 text-left">รายได้รวม</th>
                <th className="px-5 py-3 text-left">จำนวน Zakat</th>
                <th className="px-5 py-3 text-left">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historyData.records.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">{r.year + 543} ({r.year})</td>
                  <td className="px-5 py-3">{formatBaht(r.total_assets)}</td>
                  <td className="px-5 py-3 font-medium text-green-700">{formatBaht(r.zakat_amount)}</td>
                  <td className="px-5 py-3">
                    {r.is_paid
                      ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">จ่ายแล้ว</span>
                      : <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">ยังไม่จ่าย</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
