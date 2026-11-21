import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

export function TemplatesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/api/templates', { params: { limit: 100 } })).data.data as any[],
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name || !externalUrl) throw new Error('Lengkapi form');
      return api.post('/api/templates', { name, externalUrl, isDefault: false });
    },
    onSuccess: () => {
      toast.success('Link Template ditambahkan');
      qc.invalidateQueries({ queryKey: ['templates'] });
      setOpen(false);
      setName('');
      setExternalUrl('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || e.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/templates/${id}`),
    onSuccess: () => {
      toast.success('Template dihapus');
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  function openLink(id: number) {
    const token = localStorage.getItem('token');
    window.open(`https://api.theprakarsa.org/api/templates/${id}/download?token=${token}`, '_blank');
  }

  const rows = data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Template Form (Link Eksternal)</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Tambah Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Link Template</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-3">
              <div>
                <Label>Nama Template</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Form Peminjaman 2024" required />
              </div>
              <div>
                <Label>Link OneDrive / Google Drive</Label>
                <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://1drv.ms/..." required />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={createMut.isPending}>Simpan Link</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Nama Template</Th><Th>Tipe</Th><Th className="text-right">Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={3} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={3} className="text-center py-6 text-gray-500">Belum ada template</Td></Tr>
            )}
            {rows.map((t: any) => (
              <Tr key={t.id}>
                <Td>{t.name}</Td>
                <Td>Link Eksternal</Td>
                <Td className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openLink(t.id)}>
                    <ExternalLink size={14} className="mr-1" /> Buka Link
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { if(confirm('Hapus template ini?')) deleteMut.mutate(t.id) }}>
                    <Trash2 size={14} />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
