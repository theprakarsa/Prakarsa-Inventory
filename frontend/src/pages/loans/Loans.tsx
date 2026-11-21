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
import { formatDate } from '@/lib/utils';
import { Plus, Upload, RotateCcw, Trash2, Download, Search } from 'lucide-react';
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
  const [searchAsset, setSearchAsset] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loans', page, status],
    queryFn: async () => (await api.get('/api/loans', { params: { page, limit: 10, status } })).data,
  });

  const { data: availableAssets } = useQuery({
    queryKey: ['assets-tersedia'],
    queryFn: async () => (await api.get('/api/assets', { params: { limit: 500, status: 'tersedia' } })).data.data,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates-all'],
    queryFn: async () => (await api.get('/api/templates', { params: { limit: 100 } })).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (p: FormData) => api.post('/api/loans', { ...p, assetIds: selectedAssets }),
    onSuccess: () => {
      toast.success('Peminjaman dibuat');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['assets-tersedia'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      setOpen(false);
      reset();
      setSelectedAssets([]);
      setSearchAsset('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const returnMut = useMutation({
    mutationFn: (id: number) => api.patch(`/api/loans/${id}/return`),
    onSuccess: () => {
      toast.success('Asset ditandai kembali');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/loans/${id}`),
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
      return api.post(`/api/loans/${id}/attachments`, fd, {
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

  function handleDownloadTemplate() {
    const selectedId = watch('templateId');
    
    if (!templates || templates.length === 0) {
      toast.error('Belum ada template yang tersedia. Hubungi Admin.');
      return;
    }

    let idToDownload: number;

    if (selectedId) {
      idToDownload = Number(selectedId);
    } else {
      const defaultTemplate: any = templates.find((t: any) => t.isDefault);
      idToDownload = defaultTemplate ? Number(defaultTemplate.id) : Number(templates[0].id);
    }

    if (!idToDownload || isNaN(idToDownload)) {
      toast.error('Template tidak valid.');
      return;
    }

    const token = localStorage.getItem('token');
    window.open(`https://api.theprakarsa.org/api/templates/${idToDownload}/download?token=${token}`, '_blank');
  }

  const filteredAssets = availableAssets?.filter((a: any) => {
    const keyword = searchAsset.toLowerCase();
    return (
      a.name.toLowerCase().includes(keyword) || 
      a.code.toLowerCase().includes(keyword) ||
      (a.legacyCode && a.legacyCode.toLowerCase().includes(keyword))
    );
  });

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Peminjaman</h1>
        <Dialog open={open} onOpenChange={(v) => { 
          setOpen(v); 
          if (!v) {
            setSelectedAssets([]);
            setSearchAsset('');
          } 
        }}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Buat Peminjaman</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Buat Peminjaman</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => {
              if (selectedAssets.length === 0) {
                toast.error('Pilih minimal 1 asset sebelum menyimpan');
                return;
              }
              createMut.mutate(d);
            })} className="space-y-3">
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
                <div className="flex gap-2">
                  <Select {...register('templateId')} className="flex-1">
                    <option value="">-- Pilih template (opsional) --</option>
                    {templates?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
                    <Download size={16} className="mr-2" /> Unduh Form
                  </Button>
                </div>
              </div>

              <div>
                <Label>Pilih Asset (multi)</Label>
                <div className="mb-2 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <Search size={14} />
                  </div>
                  <Input
                    type="text"
                    placeholder="Cari nama atau kode barang..."
                    className="pl-9"
                    value={searchAsset}
                    onChange={(e) => setSearchAsset(e.target.value)}
                  />
                </div>

                <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {!filteredAssets || filteredAssets.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">
                      {searchAsset ? 'Barang tidak ditemukan' : 'Tidak ada asset tersedia'}
                    </p>
                  ) : (
                    filteredAssets.map((a: any) => (
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

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={createMut.isPending}>Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <Thead>
            <Tr><Th>Kode</Th><Th>Peminjam</Th><Th>Tgl Pinjam</Th><Th>Jatuh Tempo</Th><Th>Status</Th><Th>Assets</Th><Th>Aksi</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={7} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-6 text-gray-500">Belum ada data</Td></Tr>
            )}
            {rows.map((l: any) => (
              <Tr key={l.id}>
                <Td className="font-mono text-xs">{l.code}</Td>
                <Td>{l.borrowerName}<br/><span className="text-xs text-gray-500">{l.borrowerNik}</span></Td>
                <Td>{formatDate(l.loanDate)}</Td>
                <Td>{l.dueDate ? formatDate(l.dueDate) : '-'}</Td>
                <Td><Badge value={l.status} /></Td>
                <Td>
                  <ul className="list-disc list-inside text-xs">
                    {l.items?.map((item: any) => (
                      <li key={item.id}>{item.asset.name}</li>
                    ))}
                  </ul>
                </Td>
                <Td className="space-x-1">
                  {l.status === 'aktif' && (
                    <Button variant="outline" size="sm" onClick={() => returnMut.mutate(l.id)} title="Kembalikan">
                      <RotateCcw size={14} />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setUploadFor(l)} title="Upload TTD">
                    <Upload size={14} />
                  </Button>
                  {isAdmin && (
                    <Button variant="destructive" size="sm" onClick={() => { if(confirm('Hapus peminjaman?')) deleteMut.mutate(l.id) }} title="Hapus">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
      
      {/* Modal Upload Attachment */}
      {uploadFor && (
        <Dialog open={!!uploadFor} onOpenChange={() => setUploadFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Form TTD</DialogTitle></DialogHeader>
            <input type="file" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMut.mutate({ id: uploadFor.id, file });
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
