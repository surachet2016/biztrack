import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { PACKAGES } from '@biztrack/shared/constants';
import { Trash2, Download, Search } from 'lucide-react';

export const Route = createFileRoute('/_admin/admin/users')({
  component: AdminUsersPage,
});

function exportCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user to delete

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/api/admin/users/${id}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteConfirm(null);
    },
  });

  const allUsers = data?.users || [];
  const users = allUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const rows = allUsers.map(u => ({
      ชื่อ: u.name || '',
      Email: u.email || '',
      บทบาท: u.role || '',
      แพ็กเกจ: u.subscriptions?.[0]?.plan || 'ไม่มี',
      'วันหมดอายุ': u.subscriptions?.[0]?.expires_at
        ? new Date(u.subscriptions[0].expires_at).toLocaleDateString('th-TH')
        : '-',
      วันสมัคร: new Date(u.created_at).toLocaleDateString('th-TH'),
    }));
    exportCSV(rows, `biztrack-users-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const planColors = {
    free:   'bg-gray-100 text-gray-600',
    basic:  'bg-green-100 text-green-700',
    pro:    'bg-emerald-100 text-emerald-700',
    annual: 'bg-teal-100 text-teal-700',
  };

  return (
    <div>
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">ลบผู้ใช้?</h2>
              <p className="text-gray-500 text-sm mt-1">
                จะลบ <span className="font-semibold text-gray-700">{deleteConfirm.name || deleteConfirm.email}</span> พร้อมข้อมูลทั้งหมด
              </p>
              <p className="text-red-400 text-xs mt-1">⚠️ ไม่สามารถกู้คืนได้</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                ยกเลิก
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 จัดการผู้ใช้</h1>
          <p className="text-xs text-gray-400 mt-0.5">ทั้งหมด {allUsers.length} คน</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ / Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-800 w-52 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-gray-400">ไม่พบผู้ใช้</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">ผู้ใช้</th>
                <th className="px-5 py-3 text-left">แพ็กเกจ</th>
                <th className="px-5 py-3 text-left">หมดอายุ</th>
                <th className="px-5 py-3 text-left">วันที่สมัคร</th>
                <th className="px-5 py-3 text-left">บทบาท</th>
                <th className="px-5 py-3 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const sub = u.subscriptions?.[0];
                const isExpired = sub?.expires_at && new Date(sub.expires_at) < new Date();
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name || '-'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {sub ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[sub.plan] || planColors.free}`}>
                          {PACKAGES[sub.plan]?.nameTh || sub.plan}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">ไม่มี</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {sub?.expires_at ? (
                        <span className={isExpired ? 'text-red-400' : 'text-gray-500'}>
                          {new Date(sub.expires_at).toLocaleDateString('th-TH')}
                          {isExpired && ' (หมดแล้ว)'}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        className={`border rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer ${
                          u.role === 'admin'
                            ? 'border-purple-200 text-purple-700 bg-purple-50'
                            : 'border-gray-200 text-gray-600 bg-gray-50'
                        }`}
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">🛠 Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDeleteConfirm(u)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="ลบผู้ใช้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
