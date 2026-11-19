import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
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
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Printer, Trash2, Eye } from 'lucide-react';

const createSchema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  divisionId: z.coerce.number().int().positive('Pilih divisi'),
  categoryId: z.coerce.number().int().positive('Pilih kategori'),
  ownership: z.string().optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  note: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export function AssetsPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ownership, setOwnership] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, search, status, ownership],
    queryFn: async () => {
      const res = await api.get('/assets', {
        params: { page, limit: 10, search, status, ownership },
      });
      return res.data as {
        data: any[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });

  const { data: divisions } = useQuery({
    queryKey: ['divisions-all'],
    queryFn: async () => (await api.get('/divisions', { params: { limit: 200 } })).data.data,
  });
  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => (await api.get('/categories', { params: { limit: 200 } })).data.data,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { quantity: 1 } });

  const createMut = useMutation({
    mutationFn: (payload: CreateForm) => api.post('/assets', payload),
    onSuccess: () => {
      toast.success('Asset berhasil dibuat');
      qc.invalidateQueries({ queryKey: ['assets'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error?.message || 'Gagal membuat asset'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      toast.success('Asset dihapus');
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function printLabel(assetId: number) {
    const token = localStorage.getItem('token');
    window.open(
      `${import.meta.env.VITE_API_URL}/assets/${assetId}/label?token=${token}`,
      '_blank'
    );
  }

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Assets</h1>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> Tambah Asset</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Tambah Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label>Nama Barang</Label>
                    <Input {...register('name')} placeholder="Contoh: Laptop Asus" />
                    {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Divisi</Label>
                    <Select {...register('divisionId')}>
                      <option value="">Pilih</option>
                      {divisions?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </Select>
                    {errors.divisionId && <p className="text-xs text-red-600">{errors.divisionId.message}</p>}
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select {...register('categoryId')}>
                      <option value="">Pilih</option>
                      {categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                    {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Ownership</Label>
                    <Input {...register('ownership')} placeholder="AM, BN, HR, ..." />
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input {...register('brand')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Serial Number</Label>
                    <Input {...register('serialNumber')} />
                  </div>
                  <div>
                    <Label>Quantity (unit)</Label>
                    <Input type="number" min="1" {...register('quantity')} />
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
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                  <Button type="submit" disabled={createMut.isPending}>Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        <Input
          placeholder="Cari kode / nama / serial..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="max-w-[160px]"
        >
          <option value="">Semua status</option>
          <option value="tersedia">Tersedia</option>
          <option value="dipinjam">Dipinjam</option>
          <option value="terpasang">Terpasang</option>
          <option value="rusak">Rusak</option>
          <option value="hilang">Hilang</option>
          <option value="dilepas">Dilepas</option>
        </Select>
        <Input
          placeholder="Filter ownership..."
          value={ownership}
          onChange={(e) => { setOwnership(e.target.value); setPage(1); }}
          className="max-w-[160px]"
        />
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr>
              <Th>Kode</Th><Th>Nama</Th><Th>Kategori</Th>
              <Th>Ownership</Th><Th>Status</Th><Th>Qty</Th><Th>Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={7} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-6 text-gray-500">Belum ada asset</Td></Tr>
            )}
            {rows.map((a: any) => (
              <Tr key={a.id}>
                <Td className="font-mono text-xs">{a.code}</Td>
                <Td>{a.name}</Td>
                <Td>{a.category?.name}</Td>
                <Td>{a.ownership ?? '-'}</Td>
                <Td><Badge value={a.status} /></Td>
                <Td>{a.quantity ?? 1}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Link to={`/assets/${a.id}`}>
                      <Button size="sm" variant="outline" title="Detail"><Eye size={12} /></Button>
                    </Link>
                    
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => printLabel(a.id)} title="Print Label">
                        <Printer size={12} />
                      </Button>
                    )}

                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm(`Hapus asset ${a.code}?`)) deleteMut.mutate(a.id);
                      }}><Trash2 size={12} /></Button>
                    )}
                  </div>
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