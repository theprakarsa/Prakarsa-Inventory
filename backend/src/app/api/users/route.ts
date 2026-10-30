import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'staff']),
  employeeId: z.coerce.number().int().positive().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));
  const search = searchParams.get('search') || '';

  const where = search
    ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true, employee: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  const mapped = data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isActive: u.isActive,
    employeeId: u.employeeId,
    employee: u.employee,
  }));

  return paginated(mapped, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const exists = await prisma.user.findUnique({ where: { email: v.data.email } });
  if (exists) return error('DUPLICATE_EMAIL', 'Email sudah dipakai', 409);

  const roleRow = await prisma.role.findUnique({ where: { name: v.data.role } });
  if (!roleRow) return error('NOT_FOUND', 'Role tidak ditemukan', 404);

  const hashed = await bcrypt.hash(v.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: v.data.name,
      email: v.data.email,
      password: hashed,
      roleId: roleRow.id,
      employeeId: v.data.employeeId ?? null,
    },
    include: { role: true, employee: true },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'users',
    referenceId: user.id,
    description: `Tambah user ${user.email} role ${user.role.name}`,
    req,
  });

  return success({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    isActive: user.isActive,
    employee: user.employee,
  }, 'User dibuat');
}
