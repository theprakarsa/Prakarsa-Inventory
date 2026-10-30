import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const schema = z.object({ password: z.string().min(6) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, schema);
  if (!v.ok) return v.response;

  const id = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error('NOT_FOUND', 'User tidak ditemukan', 404);

  const hashed = await bcrypt.hash(v.data.password, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  await logActivity({
    userId: auth.user.userId,
    action: 'reset_password',
    module: 'users',
    referenceId: id,
    description: `Reset password user ${user.email}`,
    req,
  });

  return success(null, 'Password direset');
}
