import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Pilih asset').optional(),
  source: z.enum(['purchase', 'grant']),
  purchaseDate: z.string().min(1, 'Tanggal wajib'),
  warrantyUntil: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function PurchasesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => (await api.get('/api/purchases', { params: { page, limit: 10 } })).data,
  });
  const { data: assets } = useQuery({
    queryKey: ['assets-all'],
    queryFn: async () => (await api.get('/api/assets', { params: { limit: 500 } })).data.data,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (p: FormData) => api.post('/api/purchases', p),
    onSuccess: () => {
      toast.success('Perolehan dicatat');
      qc.invalidateQueries({ queryKey: ['purchases'] });
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const updateMut = useMutation({
    mutationFn: (p: FormData) => api.put(`/api/purchases/${editId}`, p),
    onSuccess: () => {
      toast.success('Data diperbarui');
      qc.invalidateQueries({ queryKey: ['purchases'] });
      setOpen(false);
      reset();
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/purchases/${id}`),
    onSuccess: () => {
      toast.success('Data dihapus');
      qc.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal hapus'),
  });

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setValue('assetId', p.asset?.id);
    setValue('source', p.source);
    setValue('purchaseDate', new Date(p.purchaseDate).toISOString().split('T')[0]);
    if (p.warrantyUntil) setValue('warrantyUntil', new Date(p.warrantyUntil).toISOString().split('T')[0]);
    setValue('price', Number(p.price));
    setValue('budgetProject', p.budgetProject || '');
    setValue('note', p.note || '');
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin ingin menghapus data pembelian ini?')) {
      deleteMut.mutate(id);
    }
  };

  const onSubmit = (d: FormData) => {
    if (editId) {
      updateMut.mutate(d);
    } else {
      createMut.mutate(d);
    }
  };

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Pembelian / Hibah</h1>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) { reset(); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setEditId(null); }}>
              <Plus size={16} className="mr-1" /> Catat Perolehan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit Perolehan' : 'Catat Perolehan'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {!editId && (
                <div>
                  <Label>Asset</Label>
                  <Select {...register('assetId')}>
                    <option value="">Pilih asset</option>
                    {assets?.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </Select>
                  {errors.assetId && <p className="text-xs text-red-600">{errors.assetId.message}</p>}
                </div>
              )}
              <div>
                <Label>Sumber</Label>
                <Select {...register('source')}>
                  <option value="purchase">Pembelian</option>
                  <option value="grant">Hibah</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tgl Beli</Label>
                  <Input type="date" {...register('purchaseDate')} />
                </div>
                <div>
                  <Label>Garansi Sampai</Label>
                  <Input type="date" {...register('warrantyUntil')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Harga</Label>
                  <Input type="number" step="0.01" {...register('price')} />
                </div>
                <div>
                  <Label>Budget Project</Label>
                  <Input {...register('budgetProject')} />
                </div>
              </div>
              <div>
                <Label>Catatan</Label>
                <Input {...register('note')} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editId ? 'Simpan Perubahan' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr>
              <Th>Asset</Th><Th>Sumber</Th><Th>Tgl Beli</Th><Th>Harga</Th>
              <Th>Garansi</Th><Th>Budget</Th><Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={7} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-6 text-gray-500">Belum ada data</Td></Tr>
            )}
            {rows.map((p: any) => (
              <Tr key={p.id}>
                <Td className="font-mono text-xs">
                  {p.asset?.code}
                  <br />
                  <span className="font-sans text-gray-500">{p.asset?.name}</span>
                </Td>
                <Td><Badge value={p.source} /></Td>
                <Td>{formatDate(p.purchaseDate)}</Td>
                <Td>{formatCurrency(p.price)}</Td>
                <Td>{p.warrantyUntil ? formatDate(p.warrantyUntil) : '-'}</Td>
                <Td>{p.budgetProject ?? '-'}</Td>
                <Td className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
    </div>
  );
}
