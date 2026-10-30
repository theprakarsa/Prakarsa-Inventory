import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'staff']).optional(),
  employeeId: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const user = await prisma.user.findUnique({
    where: { id: Number(params.id) },
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, updateSchema);
  if (!v.ok) return v.response;

  const id = Number(params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'User tidak ditemukan', 404);

  if (v.data.email && v.data.email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email: v.data.email } });
    if (dup) return error('DUPLICATE_EMAIL', 'Email sudah dipakai', 409);
  }

  const updateData: any = {};
  if (v.data.name !== undefined) updateData.name = v.data.name;
  if (v.data.email !== undefined) updateData.email = v.data.email;
  if (v.data.isActive !== undefined) updateData.isActive = v.data.isActive;
  if (v.data.employeeId !== undefined) updateData.employeeId = v.data.employeeId;
  if (v.data.password) updateData.password = await bcrypt.hash(v.data.password, 10);
  if (v.data.role) {
    const roleRow = await prisma.role.findUnique({ where: { name: v.data.role } });
    if (!roleRow) return error('NOT_FOUND', 'Role tidak ditemukan', 404);
    updateData.roleId = roleRow.id;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true, employee: true },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'users',
    referenceId: id,
    description: `Update user ${updated.email}`,
    req,
  });

  return success({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role.name,
    isActive: updated.isActive,
    employee: updated.employee,
  }, 'User diupdate');
}
