import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, paginated, error } from '@/lib/response';
import { saveUpload } from '@/lib/upload';
import { logActivity } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));

  const [data, total] = await Promise.all([
    prisma.formTemplate.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.formTemplate.count(),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string) || '';
  const isDefault = formData.get('isDefault') === 'true';

  if (!file) return error('NO_FILE', 'File tidak ditemukan', 400);
  if (!name) return error('NO_NAME', 'Nama template wajib', 400);

  try {
    const uploaded = await saveUpload(file, 'templates');

    if (isDefault) {
      await prisma.formTemplate.updateMany({ data: { isDefault: false } });
    }

    const template = await prisma.formTemplate.create({
      data: {
        name,
        filePath: uploaded.filePath,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        isDefault,
      },
    });

    await logActivity({
      userId: auth.user.userId,
      action: 'create',
      module: 'templates',
      referenceId: template.id,
      description: `Upload template ${name}`,
      req,
    });

    return success(template, 'Template diupload');
  } catch (e: any) {
    return error('UPLOAD_FAILED', e.message || 'Gagal upload', 400);
  }
}
