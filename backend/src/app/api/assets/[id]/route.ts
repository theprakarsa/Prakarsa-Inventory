import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['tersedia', 'dipinjam', 'terpasang', 'rusak', 'hilang', 'dilepas']).optional(),
  disposedAt: z.string().optional(),
  disposedNote: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const data = await prisma.asset.findUnique({
    where: { id: Number(params.id) },
    include: {
      division: true,
      category: true,
      purchases: { orderBy: { purchaseDate: 'desc' } },
      loanItems: { include: { loan: true } },
      damages: { orderBy: { damageDate: 'desc' } },
      installedAssets: { include: { location: true } },
    },
  });

  if (!data) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);
  return success(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, updateSchema);
  if (!v.ok) return v.response;

  const id = Number(params.id);
  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);

  const { disposedAt, ...rest } = v.data;
  const updateData: any = { ...rest };
  if (disposedAt) updateData.disposedAt = new Date(disposedAt);

  const updated = await prisma.asset.update({
    where: { id },
    data: updateData,
    include: { division: true, category: true },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'assets',
    referenceId: id,
    description: `Update asset ${updated.code}`,
    req,
  });

  return success(updated, 'Asset diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);

  if (existing.status === 'dipinjam') {
    return error('IN_USE', 'Tidak bisa dihapus — asset sedang dipinjam', 409);
  }

  await prisma.asset.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'assets',
    referenceId: id,
    description: `Hapus asset ${existing.code}`,
    req,
  });

  return success(null, 'Asset dihapus');
}
