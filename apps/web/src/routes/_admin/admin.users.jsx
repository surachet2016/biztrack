import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { PACKAGES } from '@biztrack/shared/constants';

export const Route = createFileRoute('/_admin/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/api/admin/users/${id}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = (data?.users || []).filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 จัดการผู้ใช้</h1>
        <input
          type="text"
          placeholder="ค้นหาชื่อ / Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">ผู้ใช้</th>
                <th className="px-5 py-3 text-left">แพ็กเกจ</th>
                <th className="px-5 py-3 text-left">วันที่สมัคร</th>
                <th className="px-5 py-3 text-left">บทบาท</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{u.name || '-'}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {u.subscriptions?.[0] ? (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {PACKAGES[u.subscriptions[0].plan]?.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">ไม่มี</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${u.role === 'admin' ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-gray-200 text-gray-600 bg-gray-50'}`}
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">🛠 Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
