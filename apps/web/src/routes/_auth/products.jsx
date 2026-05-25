import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { formatBaht } from '@biztrack/shared/utils';
import { Plus, Edit2, Trash2, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_auth/products')({
  component: ProductsPage,
});

const emptyForm = { name: '', sku: '', category: 'ทั่วไป', price: '', cost: '', stock_qty: '' };

function ProductsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showRecommend, setShowRecommend] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/products'),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['product-alerts'],
    queryFn: () => api.get('/api/products/alerts'),
  });

  const { data: recommendData, isFetching: loadingRecommend, refetch: fetchRecommend } = useQuery({
    queryKey: ['product-recommend'],
    queryFn: () => api.get('/api/products/recommend'),
    enabled: false,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct
      ? api.patch(`/api/products/${editProduct.id}`, data)
      : api.post('/api/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-alerts'] });
      setShowForm(false);
      setEditProduct(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-alerts'] });
    },
  });

  const handleEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku || '', category: p.category, price: p.price, cost: p.cost, stock_qty: p.stock_qty });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, price: parseFloat(form.price), cost: parseFloat(form.cost), stock_qty: parseInt(form.stock_qty) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">สินค้า</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchRecommend(); setShowRecommend(true); }}
            className="border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-50 transition flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" /> คำแนะนำ AI
          </button>
          <button
            onClick={() => { setShowForm(true); setEditProduct(null); setForm(emptyForm); }}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* Slow-moving alerts */}
      {alertsData?.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
          <p className="font-medium text-amber-800 text-sm flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> สินค้าที่ขายไม่ออก ({alertsData.alerts.length} รายการ)
          </p>
          <div className="flex flex-wrap gap-2">
            {alertsData.alerts.map((p) => (
              <span key={p.id} className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                {p.name} ({p.days_no_sale ?? '?'} วัน)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommend modal */}
      {showRecommend && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-green-600" /> คำแนะนำจาก AI</h2>
            {loadingRecommend ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{recommendData?.recommendations || 'ยังไม่มีคำแนะนำ'}</p>
            )}
            <button onClick={() => setShowRecommend(false)} className="mt-4 w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">ปิด</button>
          </div>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-bold text-gray-800 mb-4">{editProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { name: 'name', label: 'ชื่อสินค้า', type: 'text', required: true },
                { name: 'sku', label: 'รหัสสินค้า (SKU)', type: 'text' },
                { name: 'category', label: 'หมวดหมู่', type: 'text' },
                { name: 'price', label: 'ราคาขาย (บาท)', type: 'number', required: true },
                { name: 'cost', label: 'ราคาทุน (บาท)', type: 'number', required: true },
                { name: 'stock_qty', label: 'จำนวน Stock', type: 'number', required: true },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    required={field.required}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">สินค้า</th>
                <th className="px-5 py-3 text-left">ราคาขาย</th>
                <th className="px-5 py-3 text-left">ทุน</th>
                <th className="px-5 py-3 text-left">Stock</th>
                <th className="px-5 py-3 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(productsData?.products || []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">{p.sku}</p>}
                  </td>
                  <td className="px-5 py-3 text-green-600 font-medium">{formatBaht(p.price)}</td>
                  <td className="px-5 py-3 text-gray-500">{formatBaht(p.cost)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-medium ${p.stock_qty === 0 ? 'text-red-500' : 'text-gray-800'}`}>{p.stock_qty}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"><Edit2 className="w-3 h-3" /> แก้ไข</button>
                      <button onClick={() => { if (confirm('ลบสินค้านี้?')) deleteMutation.mutate(p.id); }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productsData?.products?.length === 0 && (
            <div className="text-center py-10 text-gray-400">ยังไม่มีสินค้า คลิก "เพิ่มสินค้า" เพื่อเริ่มต้น</div>
          )}
        </div>
      )}
    </div>
  );
}
