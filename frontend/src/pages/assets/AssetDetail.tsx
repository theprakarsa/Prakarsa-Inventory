import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Printer, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => (await api.get(`/api/assets/${id}`)).data.data,
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/api/assets/${id}`),
    onSuccess: () => {
      toast.success('Asset dihapus');
      qc.invalidateQueries({ queryKey: ['assets'] });
      navigate('/assets');
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (error || !data) return <div className="p-6 text-red-600">Asset tidak ditemukan</div>;

  function printLabel() {
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_URL}/api/assets/${id}/label?token=${token}`, '_blank');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Link to="/assets">
            <Button size="sm" variant="outline"><ArrowLeft size={14} /></Button>
          </Link>
          <h1 className="text-2xl font-semibold">Detail Asset</h1>
        </div>
        <div className="flex gap-2">
          
          {/* Tombol Cetak Label HANYA muncul untuk Admin */}
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={printLabel}>
              <Printer size={14} className="mr-1" /> Cetak Label
            </Button>
          )}

          {/* Tombol Hapus HANYA muncul untuk Admin */}
          {isAdmin && (
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirm(`Hapus asset ${data.code}?`)) deleteMut.mutate();
            }}>
              <Trash2 size={14} className="mr-1" /> Hapus
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>{data.name}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Kode:</span> <span className="font-mono font-medium">{data.code}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge value={data.status} /></div>
              <div><span className="text-gray-500">Divisi:</span> {data.division?.name}</div>
              <div><span className="text-gray-500">Kategori:</span> {data.category?.name}</div>
              <div><span className="text-gray-500">Brand:</span> {data.brand ?? '-'}</div>
              <div><span className="text-gray-500">Serial:</span> {data.serialNumber ?? '-'}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Harga:</span> {formatCurrency(data.price)}</div>
              <div><span className="text-gray-500">Budget Project:</span> {data.budgetProject ?? '-'}</div>
              <div><span className="text-gray-500">Dibuat:</span> {formatDateTime(data.createdAt)}</div>
              <div><span className="text-gray-500">Diupdate:</span> {formatDateTime(data.updatedAt)}</div>
              {data.note && <div><span className="text-gray-500">Catatan:</span> {data.note}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {data.purchases?.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Riwayat Perolehan</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <Thead><Tr><Th>Sumber</Th><Th>Tanggal</Th><Th>Harga</Th><Th>Budget</Th></Tr></Thead>
              <Tbody>
                {data.purchases.map((p: any) => (
                  <Tr key={p.id}>
                    <Td><Badge value={p.source} /></Td>
                    <Td>{formatDate(p.purchaseDate)}</Td>
                    <Td>{formatCurrency(p.price)}</Td>
                    <Td>{p.budgetProject ?? '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.loanItems?.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Riwayat Peminjaman</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <Thead><Tr><Th>Kode</Th><Th>Peminjam</Th><Th>Tanggal</Th><Th>Status</Th></Tr></Thead>
              <Tbody>
                {data.loanItems.map((li: any) => (
                  <Tr key={li.id}>
                    <Td className="font-mono text-xs">{li.loan?.code}</Td>
                    <Td>{li.loan?.borrowerName}</Td>
                    <Td>{formatDate(li.loan?.loanDate)}</Td>
                    <Td><Badge value={li.loan?.status} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.damages?.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Riwayat Kerusakan</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <Thead><Tr><Th>Jenis</Th><Th>Tanggal</Th><Th>Catatan</Th></Tr></Thead>
              <Tbody>
                {data.damages.map((d: any) => (
                  <Tr key={d.id}>
                    <Td><Badge value={d.type} /></Td>
                    <Td>{formatDate(d.damageDate)}</Td>
                    <Td>{d.note ?? '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.installedAssets?.length > 0 && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Riwayat Pemasangan</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <Thead><Tr><Th>Lokasi</Th><Th>Tanggal</Th><Th>Pemasang</Th></Tr></Thead>
              <Tbody>
                {data.installedAssets.map((i: any) => (
                  <Tr key={i.id}>
                    <Td>{i.location?.name}</Td>
                    <Td>{formatDate(i.installedAt)}</Td>
                    <Td>{i.installedBy}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}