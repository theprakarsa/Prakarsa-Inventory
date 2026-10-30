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
  building: z.string().optional(),
  floor: z.string().optional(),
  pic: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const data = await prisma.location.findUnique({ where: { id: Number(params.id) } });
  if (!data) return error('NOT_FOUND', 'Lokasi tidak ditemukan', 404);
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
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Lokasi tidak ditemukan', 404);

  const updated = await prisma.location.update({ where: { id }, data: v.data });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'locations',
    referenceId: id,
    description: `Update lokasi ${updated.name}`,
    req,
  });

  return success(updated, 'Lokasi diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Lokasi tidak ditemukan', 404);

  const installedCount = await prisma.installedAsset.count({ where: { locationId: id } });
  if (installedCount > 0) {
    return error('IN_USE', `Tidak bisa dihapus — dipakai ${installedCount} asset terpasang`, 409);
  }

  await prisma.location.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'locations',
    referenceId: id,
    description: `Hapus lokasi ${existing.name}`,
    req,
  });

  return success(null, 'Lokasi dihapus');
}
