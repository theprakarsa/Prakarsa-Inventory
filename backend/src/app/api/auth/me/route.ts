import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, error } from '@/lib/response';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    include: { role: true, employee: true },
  });

  if (!user) return error('NOT_FOUND', 'User tidak ditemukan', 404);

  return success({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    isActive: user.isActive,
    employee: user.employee,
  });
}
