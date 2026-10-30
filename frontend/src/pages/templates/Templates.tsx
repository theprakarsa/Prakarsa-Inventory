import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Download, Star } from 'lucide-react';

export function TemplatesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/templates', { params: { limit: 100 } })).data.data as any[],
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!file || !name) throw new Error('Lengkapi form');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name);
      return api.post('/templates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Template diupload');
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['templates-all'] });
      setOpen(false);
      setName('');
      setFile(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      toast.success('Template dihapus');
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['templates-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const setDefaultMut = useMutation({
    mutationFn: (id: number) => api.put(`/templates/${id}`, { isDefault: true }),
    onSuccess: () => {
      toast.success('Template default diset');
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['templates-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function download(id: number) {
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_URL}/templates/${id}/download?token=${token}`, '_blank');
  }

  const rows = data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Template Form</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Upload</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nama Template</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Form Peminjaman Standar" />
              </div>
              <div>
                <Label>File (jpg/png/pdf)</Label>
                <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !name || !file}>
                  {createMut.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Nama</Th><Th>File</Th><Th>Default</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={4} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={4} className="text-center py-6 text-gray-500">Belum ada template</Td></Tr>
            )}
            {rows.map((t: any) => (
              <Tr key={t.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    {t.isDefault && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    {t.name}
                  </div>
                </Td>
                <Td className="text-xs text-gray-600">{t.fileName}</Td>
                <Td>
                  {t.isDefault ? (
                    <span className="text-xs text-green-700 font-medium">Ya</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setDefaultMut.mutate(t.id)}>Set Default</Button>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => download(t.id)}><Download size={12} /></Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm('Hapus template ini?')) deleteMut.mutate(t.id);
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
