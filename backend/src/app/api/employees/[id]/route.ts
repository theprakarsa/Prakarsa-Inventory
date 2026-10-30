import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const updateSchema = z.object({
  nik: z.string().min(1).max(30).optional(),
  name: z.string().min(1).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const data = await prisma.employee.findUnique({ where: { id: Number(params.id) } });
  if (!data) return error('NOT_FOUND', 'Karyawan tidak ditemukan', 404);
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
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Karyawan tidak ditemukan', 404);

  if (v.data.nik && v.data.nik !== existing.nik) {
    const dup = await prisma.employee.findUnique({ where: { nik: v.data.nik } });
    if (dup) return error('DUPLICATE_NIK', 'NIK sudah dipakai', 409);
  }

  const updated = await prisma.employee.update({ where: { id }, data: v.data });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'employees',
    referenceId: id,
    description: `Update karyawan ${updated.nik}`,
    req,
  });

  return success(updated, 'Karyawan diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Karyawan tidak ditemukan', 404);

  const linkedUser = await prisma.user.count({ where: { employeeId: id } });
  if (linkedUser > 0) {
    return error('IN_USE', 'Tidak bisa dihapus — terkait user', 409);
  }

  await prisma.employee.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'employees',
    referenceId: id,
    description: `Hapus karyawan ${existing.nik}`,
    req,
  });

  return success(null, 'Karyawan dihapus');
}
