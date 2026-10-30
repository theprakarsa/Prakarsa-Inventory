import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';
import fs from 'fs/promises';
import path from 'path';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const data = await prisma.formTemplate.findUnique({ where: { id: Number(params.id) } });
  if (!data) return error('NOT_FOUND', 'Template tidak ditemukan', 404);
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
  const existing = await prisma.formTemplate.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Template tidak ditemukan', 404);

  if (v.data.isDefault === true) {
    await prisma.formTemplate.updateMany({ data: { isDefault: false } });
  }

  const updated = await prisma.formTemplate.update({
    where: { id },
    data: v.data,
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'templates',
    referenceId: id,
    description: `Update template ${updated.name}`,
    req,
  });

  return success(updated, 'Template diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.formTemplate.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Template tidak ditemukan', 404);

  try {
    const filepath = path.join(process.env.UPLOAD_DIR || './uploads', existing.filePath);
    await fs.unlink(filepath).catch(() => {});
  } catch {}

  await prisma.formTemplate.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'templates',
    referenceId: id,
    description: `Hapus template ${existing.name}`,
    req,
  });

  return success(null, 'Template dihapus');
}
