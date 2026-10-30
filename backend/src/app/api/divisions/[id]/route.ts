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
  code: z.string().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const data = await prisma.division.findUnique({ where: { id: Number(params.id) } });
  if (!data) return error('NOT_FOUND', 'Divisi tidak ditemukan', 404);

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
  const existing = await prisma.division.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Divisi tidak ditemukan', 404);

  if (v.data.code && v.data.code !== existing.code) {
    const dup = await prisma.division.findUnique({ where: { code: v.data.code } });
    if (dup) return error('DUPLICATE_CODE', 'Kode sudah dipakai', 409);
  }

  const updated = await prisma.division.update({ where: { id }, data: v.data });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'divisions',
    referenceId: id,
    description: `Update divisi ${updated.code}`,
    req,
  });

  return success(updated, 'Divisi diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.division.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Divisi tidak ditemukan', 404);

  const assetCount = await prisma.asset.count({ where: { divisionId: id } });
  if (assetCount > 0) {
    return error('IN_USE', `Tidak bisa dihapus — dipakai ${assetCount} asset`, 409);
  }

  await prisma.division.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'divisions',
    referenceId: id,
    description: `Hapus divisi ${existing.code}`,
    req,
  });

  return success(null, 'Divisi dihapus');
}
