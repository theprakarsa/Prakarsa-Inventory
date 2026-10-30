import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error('NOT_FOUND', 'User tidak ditemukan', 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'users',
    referenceId: id,
    description: `${updated.isActive ? 'Aktifkan' : 'Nonaktifkan'} user ${updated.email}`,
    req,
  });

  return success({ id: updated.id, isActive: updated.isActive }, 'Status user diubah');
}
