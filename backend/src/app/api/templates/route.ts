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
  externalUrl: z.string().url('Format URL tidak valid'),
  isDefault: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const data = await prisma.formTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return success(data);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const template = await prisma.formTemplate.create({
    data: {
      name: v.data.name,
      externalUrl: v.data.externalUrl,
      isDefault: v.data.isDefault || false,
    },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'templates',
    referenceId: template.id,
    description: `Tambah template link: ${v.data.name}`,
    req,
  });

  return success(template, 'Template berhasil ditambahkan');
}
