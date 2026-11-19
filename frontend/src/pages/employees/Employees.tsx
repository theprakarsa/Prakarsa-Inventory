import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
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
  nik: z.string().min(1, 'NIK wajib'),
  name: z.string().min(1, 'Nama wajib'),
  department: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export function EmployeesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () =>
      (await api.get('/employees', { params: { limit: 300 } })).data.data as any[],
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const saveMut = useMutation({
    mutationFn: (p: FormData) =>
      editing ? api.put(`/employees/${editing.id}`, p) : api.post('/employees', p),
    onSuccess: () => {
      toast.success(editing ? 'Karyawan diupdate' : 'Karyawan dibuat');
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employees-all'] });
      setOpen(false);
      setEditing(null);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      toast.success('Karyawan dihapus');
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employees-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function create() {
    setEditing(null);
    reset({ nik: '', name: '', department: '', position: '', isActive: true });
    setOpen(true);
  }
  function edit(row: any) {
    setEditing(row);
    reset({
      nik: row.nik,
      name: row.name,
      department: row.department ?? '',
      position: row.position ?? '',
      isActive: row.isActive,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Karyawan</h1>
        <Button onClick={create}><Plus size={16} className="mr-1" /> Tambah</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Karyawan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-3">
            <div>
              <Label>NIK</Label>
              <Input {...register('nik')} />
              {errors.nik && <p className="text-xs text-red-600">{errors.nik.message}</p>}
            </div>
            <div>
              <Label>Nama</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Departemen</Label>
              <Input {...register('department')} />
            </div>
            <div>
              <Label>Jabatan</Label>
              <Input {...register('position')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="emp-active" {...register('isActive')} />
              <label htmlFor="emp-active" className="text-sm">Aktif</label>
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
            <Tr><Th>NIK</Th><Th>Nama</Th><Th>Departemen</Th><Th>Jabatan</Th><Th>Status</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={6} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && data?.length === 0 && (
              <Tr><Td colSpan={6} className="text-center py-6 text-gray-500">Belum ada karyawan</Td></Tr>
            )}
            {data?.map((r: any) => (
              <Tr key={r.id}>
                <Td className="font-mono">{r.nik}</Td>
                <Td>{r.name}</Td>
                <Td>{r.department ?? '-'}</Td>
                <Td>{r.position ?? '-'}</Td>
                <Td><Badge value={r.isActive ? 'tersedia' : 'dilepas'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => edit(r)}><Pencil size={12} /></Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm(`Hapus karyawan ${r.nik}?`)) deleteMut.mutate(r.id);
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
