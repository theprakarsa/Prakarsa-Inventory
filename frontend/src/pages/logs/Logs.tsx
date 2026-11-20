import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { formatDateTime } from '@/lib/utils';

export function LogsPage() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, module, action],
    queryFn: async () =>
      (await api.get('/api/activity-logs', { params: { page, limit: 20, module, action } })).data,
  });

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Log Aktivitas</h1>
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        <Select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} className="max-w-[180px]">
          <option value="">Semua modul</option>
          <option value="auth">Auth</option>
          <option value="assets">Assets</option>
          <option value="loans">Peminjaman</option>
          <option value="damages">Kerusakan</option>
          <option value="installed">Terpasang</option>
          <option value="purchases">Pembelian</option>
          <option value="users">Users</option>
          <option value="templates">Template</option>
          <option value="divisions">Divisi</option>
          <option value="categories">Kategori</option>
          <option value="employees">Karyawan</option>
          <option value="locations">Lokasi</option>
        </Select>
        <Input
          placeholder="Filter aksi (login/create/update/delete...)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="max-w-[260px]"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr>
              <Th>Waktu</Th><Th>User</Th><Th>Aksi</Th><Th>Modul</Th><Th>Deskripsi</Th><Th>IP</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={6} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={6} className="text-center py-6 text-gray-500">Belum ada log</Td></Tr>
            )}
            {rows.map((l: any) => (
              <Tr key={l.id}>
                <Td className="text-xs whitespace-nowrap">{formatDateTime(l.createdAt)}</Td>
                <Td className="text-xs">{l.user?.name ?? '-'}</Td>
                <Td className="text-xs font-medium">{l.action}</Td>
                <Td className="text-xs">{l.module}</Td>
                <Td className="text-xs max-w-[320px] truncate">{l.description ?? '-'}</Td>
                <Td className="text-xs font-mono">{l.ipAddress ?? '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {meta && (
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      )}
    </div>
  );
}
