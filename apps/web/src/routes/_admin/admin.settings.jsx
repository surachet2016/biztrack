import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { Save } from 'lucide-react';

export const Route = createFileRoute('/_admin/admin/settings')({
  component: AdminSettingsPage,
});

const SETTING_FIELDS = [
  { key: 'site_name', label: 'ชื่อเว็บไซต์', type: 'text' },
  { key: 'bank_name', label: 'ชื่อธนาคาร', type: 'text' },
  { key: 'bank_account_number', label: 'เลขบัญชี', type: 'text' },
  { key: 'bank_account_name', label: 'ชื่อบัญชี', type: 'text' },
  { key: 'nisab_value_thb', label: 'Nisab (บาท)', type: 'number' },
  { key: 'contact_email', label: 'Email ติดต่อ', type: 'email' },
];

function AdminSettingsPage() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/api/admin/settings'),
  });

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/api/admin/settings', form),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ ตั้งค่าระบบ</h1>

      {saved && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl mb-4">✅ บันทึกการตั้งค่าแล้ว</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {SETTING_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type={field.type}
              value={form[field.key] || ''}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ))}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
