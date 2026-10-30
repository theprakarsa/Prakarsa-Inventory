import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));
  const search = searchParams.get('search') || '';

  const where = search
    ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.division.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.division.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const exists = await prisma.division.findUnique({ where: { code: v.data.code } });
  if (exists) return error('DUPLICATE_CODE', 'Kode divisi sudah dipakai', 409);

  const created = await prisma.division.create({ data: v.data });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'divisions',
    referenceId: created.id,
    description: `Tambah divisi ${created.code} - ${created.name}`,
    req,
  });

  return success(created, 'Divisi dibuat');
}
