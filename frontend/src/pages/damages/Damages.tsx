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
import { Plus } from 'lucide-react';

const schema = z.object({
  assetId: z.coerce.number().int().positive('Pilih asset'),
  type: z.enum(['hilang', 'rusak_pemakaian', 'rusak_hardware']),
  damageDate: z.string().min(1, 'Tanggal wajib'),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function DamagesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['damages', page],
    queryFn: async () => (await api.get('/damages', { params: { page, limit: 10 } })).data,
  });
  const { data: assets } = useQuery({
    queryKey: ['assets-all'],
    queryFn: async () => (await api.get('/assets', { params: { limit: 500 } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (p: FormData) => api.post('/damages', p),
    onSuccess: () => {
      toast.success('Laporan kerusakan dibuat');
      qc.invalidateQueries({ queryKey: ['damages'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
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
        <h1 className="text-2xl font-semibold">Kerusakan</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Lapor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Lapor Kerusakan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-3">
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
              <div>
                <Label>Jenis</Label>
                <Select {...register('type')}>
                  <option value="hilang">Hilang</option>
                  <option value="rusak_pemakaian">Rusak Pemakaian</option>
                  <option value="rusak_hardware">Rusak Hardware</option>
                </Select>
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input type="date" {...register('damageDate')} />
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
            <Tr><Th>Asset</Th><Th>Jenis</Th><Th>Tanggal</Th><Th>Catatan</Th></Tr>
          </Thead>
          <Tbody>
            {isLoading && <Tr><Td colSpan={4} className="text-center py-6">Loading...</Td></Tr>}
            {!isLoading && rows.length === 0 && (
              <Tr><Td colSpan={4} className="text-center py-6 text-gray-500">Belum ada kerusakan</Td></Tr>
            )}
            {rows.map((d: any) => (
              <Tr key={d.id}>
                <Td className="font-mono text-xs">
                  {d.asset?.code}
                  <br />
                  <span className="font-sans text-gray-500">{d.asset?.name}</span>
                </Td>
                <Td><Badge value={d.type} /></Td>
                <Td>{formatDate(d.damageDate)}</Td>
                <Td>{d.note ?? '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />}
    </div>
  );
}
