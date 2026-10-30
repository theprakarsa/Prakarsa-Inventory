import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { formatDate } from '@/lib/utils';
import { Plus, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  borrowerName: z.string().min(1, 'Nama wajib'),
  borrowerNik: z.string().min(1, 'NIK wajib'),
  loanDate: z.string().min(1, 'Tanggal wajib'),
  dueDate: z.string().optional(),
  templateId: z.coerce.number().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function LoansPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [uploadFor, setUploadFor] = useState<any>(null);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, status],
    queryFn: async () => (await api.get('/loans', { params: { page, limit: 10, status } })).data,
  });

  const { data: availableAssets } = useQuery({
    queryKey: ['assets-tersedia'],
    queryFn: async () => (await api.get('/assets', { params: { limit: 500, status: 'tersedia' } })).data.data,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates-all'],
    queryFn: async () => (await api.get('/templates', { params: { limit: 100 } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (p: FormData) => api.post('/loans', { ...p, assetIds: selectedAssets }),
    onSuccess: () => {
      toast.success('Peminjaman dibuat');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['assets-tersedia'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      setOpen(false);
      reset();
      setSelectedAssets([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const returnMut = useMutation({
    mutationFn: (id: number) => api.patch(`/loans/${id}/return`),
    onSuccess: () => {
      toast.success('Asset ditandai kembali');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/loans/${id}`),
    onSuccess: () => {
      toast.success('Peminjaman dihapus');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const uploadMut = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post(`/loans/${id}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Form TTD terupload');
      qc.invalidateQueries({ queryKey: ['loans'] });
      setUploadFor(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal upload'),
  });

  function toggleAsset(id: number) {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Peminjaman</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedAssets([]); }}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Buat Peminjaman</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Buat Peminjaman</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Nama Peminjam</Label>
                  <Input {...register('borrowerName')} />
                  {errors.borrowerName && <p className="text-xs text-red-600">{errors.borrowerName.message}</p>}
                </div>
                <div>
                  <Label>NIK</Label>
                  <Input {...register('borrowerNik')} />
                  {errors.borrowerNik && <p className="text-xs text-red-600">{errors.borrowerNik.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tanggal Pinjam</Label>
                  <Input type="date" {...register('loanDate')} />
                </div>
                <div>
                  <Label>Jatuh Tempo</Label>
                  <Input type="date" {...register('dueDate')} />
                </div>
              </div>
              <div>
                <Label>Template Form</Label>
                <Select {...register('templateId')}>
                  <option value="">-- Pilih template (opsional) --</option>
                  {templates?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Pilih Asset (multi)</Label>
                <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {!availableAssets || availableAssets.length === 0 ? (
                    <p className="text-xs text-gray-500">Tidak ada asset tersedia</p>
                  ) : (
                    availableAssets.map((a: any) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(a.id)}
                          onChange={() => toggleAsset(a.id)}
                        />
                        <span className="font-mono text-xs">{a.code}</span> — {a.name}
                      </label>
                    ))
                  )}
                </div>
                {selectedAssets.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">Pilih minimal 1 asset</p>
                )}
              </div>
              <div>
                <Label>Catatan</Label>
                <Input {...register('note')} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={createMut.isPending || selectedAssets.length === 0}>Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-3">
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[180px]">
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="selesai">Selesai</option>
        </Select>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Kode</Th><Th>Peminjam</Th><Th>Tgl Pinjam</Th><Th>Items</Th><Th>Status</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={6} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={6} className="text-center py-6 text-gray-500">Belum ada peminjaman</Td></Tr>
            )}
            {rows.map((l: any) => (
              <Tr key={l.id}>
                <Td className="font-mono text-xs">{l.code}</Td>
                <Td>
                  {l.borrowerName}
                  <br />
                  <span className="text-xs text-gray-500">{l.borrowerNik}</span>
                </Td>
                <Td>{formatDate(l.loanDate)}</Td>
                <Td>{l.items?.length ?? 0} item</Td>
                <Td><Badge value={l.status} /></Td>
                <Td>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setUploadFor(l)} title="Upload TTD">
                      <Upload size={12} />
                    </Button>
                    {l.status === 'aktif' && (
                      <Button size="sm" variant="default" onClick={() => returnMut.mutate(l.id)} title="Tandai kembali">
                        <RotateCcw size={12} />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm('Hapus peminjaman?')) deleteMut.mutate(l.id);
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

      <Dialog open={!!uploadFor} onOpenChange={(v) => !v && setUploadFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Form TTD — {uploadFor?.code}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>File (jpg/png/pdf, max 10MB)</Label>
            <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && uploadFor) uploadMut.mutate({ id: uploadFor.id, file: f });
            }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
