import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  code: z.string().min(1, 'Kode wajib').max(10),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export function CategoriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () =>
      (await api.get('/categories', { params: { limit: 200 } })).data.data as any[],
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const saveMut = useMutation({
    mutationFn: (p: FormData) =>
      editing ? api.put(`/categories/${editing.id}`, p) : api.post('/categories', p),
    onSuccess: () => {
      toast.success(editing ? 'Kategori diupdate' : 'Kategori dibuat');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      setOpen(false);
      setEditing(null);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('Kategori dihapus');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function create() {
    setEditing(null);
    reset({ name: '', code: '', isActive: true });
    setOpen(true);
  }
  function edit(row: any) {
    setEditing(row);
    reset({ name: row.name, code: row.code, isActive: row.isActive });
    setOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Kategori</h1>
        <Button onClick={create}><Plus size={16} className="mr-1" /> Tambah</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Kategori</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-3">
            <div>
              <Label>Nama</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Kode (max 10)</Label>
              <Input {...register('code')} />
              {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="cat-active" {...register('isActive')} />
              <label htmlFor="cat-active" className="text-sm">Aktif</label>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Kode</Th><Th>Nama</Th><Th>Status</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={4} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && data?.length === 0 && (
              <Tr><Td colSpan={4} className="text-center py-6 text-gray-500">Belum ada kategori</Td></Tr>
            )}
            {data?.map((d: any) => (
              <Tr key={d.id}>
                <Td className="font-mono">{d.code}</Td>
                <Td>{d.name}</Td>
                <Td><Badge value={d.isActive ? 'tersedia' : 'dilepas'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => edit(d)}><Pencil size={12} /></Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm(`Hapus kategori ${d.code}?`)) deleteMut.mutate(d.id);
                    }}><Trash2 size={12} /></Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
