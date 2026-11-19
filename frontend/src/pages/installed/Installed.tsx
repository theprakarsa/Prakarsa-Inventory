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
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Pilih asset'),
  locationId: z.coerce.number().int().positive('Pilih lokasi'),
  installedAt: z.string().min(1, 'Tanggal wajib'),
  installedBy: z.string().min(1, 'Nama pemasang wajib'),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function InstalledPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['installed', page],
    queryFn: async () => (await api.get('/installed', { params: { page, limit: 10 } })).data,
  });
  const { data: assets } = useQuery({
    queryKey: ['assets-tersedia'],
    queryFn: async () => (await api.get('/assets', { params: { limit: 500, status: 'tersedia' } })).data.data,
  });
  const { data: locations } = useQuery({
    queryKey: ['locations-all'],
    queryFn: async () => (await api.get('/locations', { params: { limit: 200 } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (p: FormData) => api.post('/installed', p),
    onSuccess: () => {
      toast.success('Asset terpasang dicatat');
      qc.invalidateQueries({ queryKey: ['installed'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['assets-tersedia'] });
      setOpen(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Gagal'),
  });

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Asset Terpasang</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Tambah</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Catat Asset Terpasang</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-3">
              <div>
                <Label>Asset (status tersedia)</Label>
                <Select {...register('assetId')}>
                  <option value="">Pilih asset</option>
                  {assets?.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </Select>
                {errors.assetId && <p className="text-xs text-red-600">{errors.assetId.message}</p>}
              </div>
              <div>
                <Label>Lokasi</Label>
                <Select {...register('locationId')}>
                  <option value="">Pilih lokasi</option>
                  {locations?.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.building ?? ''}</option>
                  ))}
                </Select>
                {errors.locationId && <p className="text-xs text-red-600">{errors.locationId.message}</p>}
              </div>
              <div>
                <Label>Tanggal Pasang</Label>
                <Input type="date" {...register('installedAt')} />
              </div>
              <div>
                <Label>Dipasang Oleh</Label>
                <Input {...register('installedBy')} placeholder="Nama teknisi" />
                {errors.installedBy && <p className="text-xs text-red-600">{errors.installedBy.message}</p>}
              </div>
              <div>
                <Label>Catatan</Label>
                <Input {...register('note')} />
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
            <Tr><Th>Asset</Th><Th>Lokasi</Th><Th>Tgl Pasang</Th><Th>Pemasang</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={4} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={4} className="text-center py-6 text-gray-500">Belum ada asset terpasang</Td></Tr>
            )}
            {rows.map((i: any) => (
              <Tr key={i.id}>
                <Td className="font-mono text-xs">
                  {i.asset?.code}
                  <br />
                  <span className="font-sans text-gray-500">{i.asset?.name}</span>
                </Td>
                <Td>{i.location?.name}<br /><span className="text-xs text-gray-500">{i.location?.building} {i.location?.floor}</span></Td>
                <Td>{formatDate(i.installedAt)}</Td>
                <Td>{i.installedBy}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
    </div>
  );
}
