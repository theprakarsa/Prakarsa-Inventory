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
import { Select } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, KeyRound, Power } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter').optional().or(z.literal('')),
  role: z.enum(['admin', 'staff']),
  employeeId: z.coerce.number().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [resetFor, setResetFor] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users', { params: { limit: 200 } })).data.data as any[],
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: async () => (await api.get('/employees', { params: { limit: 300 } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const saveMut = useMutation({
    mutationFn: (p: FormData) => {
      const payload: any = {
        name: p.name,
        email: p.email,
        role: p.role,
        employeeId: p.employeeId ? Number(p.employeeId) : null,
      };
      if (p.password) payload.password = p.password;
      return editing ? api.put(`/users/${editing.id}`, payload) : api.post('/users', payload);
    },
    onSuccess: () => {
      toast.success('User disimpan');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setEditing(null);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      toast.success('Status user diubah');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const resetMut = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.post(`/users/${id}/reset-password`, { password }),
    onSuccess: () => {
      toast.success('Password direset');
      setResetFor(null);
      setNewPassword('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function create() {
    setEditing(null);
    reset({ name: '', email: '', password: '', role: 'staff', employeeId: '' });
    setOpen(true);
  }
  function edit(u: any) {
    setEditing(u);
    reset({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      employeeId: u.employeeId ?? '',
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button onClick={create}><Plus size={16} className="mr-1" /> Tambah</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} User</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-3">
            <div>
              <Label>Nama</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label>{editing ? 'Password Baru (opsional)' : 'Password'}</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <Select {...register('role')}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div>
              <Label>Link Karyawan (opsional)</Label>
              <Select {...register('employeeId')}>
                <option value="">-- Tidak terkait --</option>
                {employees?.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nik} — {e.name}</option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
              <Button type="submit" disabled={saveMut.isPending}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetFor} onOpenChange={(v) => !v && setResetFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password — {resetFor?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Password Baru</Label>
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
              <Button
                onClick={() => resetFor && resetMut.mutate({ id: resetFor.id, password: newPassword })}
                disabled={resetMut.isPending || newPassword.length < 6}
              >Reset</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Nama</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={5} className="text-center py-6">Loading...</Td></Tr>}
            {data?.map((u: any) => (
              <Tr key={u.id}>
                <Td>{u.name}</Td>
                <Td className="text-xs">{u.email}</Td>
                <Td className="capitalize">{u.role}</Td>
                <Td><Badge value={u.isActive ? 'tersedia' : 'dilepas'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => edit(u)} title="Edit"><Pencil size={12} /></Button>
                    <Button size="sm" variant="outline" onClick={() => setResetFor(u)} title="Reset Password"><KeyRound size={12} /></Button>
                    <Button size="sm" variant="outline" onClick={() => toggleMut.mutate(u.id)} title="Toggle Aktif"><Power size={12} /></Button>
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
