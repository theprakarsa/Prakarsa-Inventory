import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer } from 'lucide-react';

type Tab = 'assets' | 'loans' | 'damages';

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('assets');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  const { data } = useQuery({
    queryKey: ['report', tab, page, from, to, status],
    queryFn: async () =>
      (await api.get(`/reports/${tab}`, { params: { page, limit: 100, from, to, status } })).data,
  });

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      {/* HEADER & FILTER — tidak dicetak */}
      <div className="no-print">
        <h1 className="text-2xl font-semibold mb-4">Laporan</h1>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button variant={tab === 'assets' ? 'default' : 'outline'} onClick={() => { setTab('assets'); setPage(1); }}>Asset</Button>
          <Button variant={tab === 'loans' ? 'default' : 'outline'} onClick={() => { setTab('loans'); setPage(1); }}>Peminjaman</Button>
          <Button variant={tab === 'damages' ? 'default' : 'outline'} onClick={() => { setTab('damages'); setPage(1); }}>Kerusakan</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer size={14} className="mr-1" /> Print</Button>
        </div>

        <Card className="mb-4">
          <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-600">Dari Tanggal</label>
                <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Sampai Tanggal</label>
                <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Status</label>
                <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="">Semua</option>
                  {tab === 'loans' && <>
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai</option>
                  </>}
                  {tab === 'assets' && <>
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                    <option value="terpasang">Terpasang</option>
                    <option value="rusak">Rusak</option>
                    <option value="hilang">Hilang</option>
                  </>}
                  {tab === 'damages' && <>
                    <option value="hilang">Hilang</option>
                    <option value="rusak_pemakaian">Rusak Pemakaian</option>
                    <option value="rusak_hardware">Rusak Hardware</option>
                  </>}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KONTEN PRINT — yang dicetak */}
      <div className="print-area">
        <div className="mb-3" style={{ display: 'none' }}>
          {/* header print — hanya muncul di print via CSS */}
        </div>
        <h2 className="text-lg font-semibold mb-1 hidden print:block">
          Laporan {tab === 'assets' ? 'Asset' : tab === 'loans' ? 'Peminjaman' : 'Kerusakan'}
        </h2>
        <p className="text-xs text-gray-600 mb-3 hidden print:block">
          Dicetak: {new Date().toLocaleString('id-ID')}
          {from && ` | Dari: ${from}`}
          {to && ` | Sampai: ${to}`}
          {status && ` | Status: ${status}`}
        </p>

        <div className="bg-white rounded-lg border">
          {tab === 'assets' && (
            <Table>
              <Thead><Tr><Th>Kode</Th><Th>Nama</Th><Th>Kategori</Th><Th>Status</Th><Th>Harga</Th></Tr></Thead>
              <Tbody>
                {rows.map((a: any) => (
                  <Tr key={a.id}>
                    <Td className="font-mono text-xs">{a.code}</Td>
                    <Td>{a.name}</Td>
                    <Td>{a.category?.name}</Td>
                    <Td><Badge value={a.status} /></Td>
                    <Td>{formatCurrency(a.price)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          {tab === 'loans' && (
            <Table>
              <Thead><Tr><Th>Kode</Th><Th>Peminjam</Th><Th>Tgl Pinjam</Th><Th>Items</Th><Th>Status</Th></Tr></Thead>
              <Tbody>
                {rows.map((l: any) => (
                  <Tr key={l.id}>
                    <Td className="font-mono text-xs">{l.code}</Td>
                    <Td>{l.borrowerName}</Td>
                    <Td>{formatDate(l.loanDate)}</Td>
                    <Td>{l.items?.length ?? 0}</Td>
                    <Td><Badge value={l.status} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          {tab === 'damages' && (
            <Table>
              <Thead><Tr><Th>Asset</Th><Th>Jenis</Th><Th>Tanggal</Th><Th>Catatan</Th></Tr></Thead>
              <Tbody>
                {rows.map((d: any) => (
                  <Tr key={d.id}>
                    <Td className="font-mono text-xs">{d.asset?.code}</Td>
                    <Td><Badge value={d.type} /></Td>
                    <Td>{formatDate(d.damageDate)}</Td>
                    <Td>{d.note ?? '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      </div>

      <div className="no-print">
        {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
      </div>
    </div>
  );
}
