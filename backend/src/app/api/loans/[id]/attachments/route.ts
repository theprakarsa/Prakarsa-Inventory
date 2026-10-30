import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, error } from '@/lib/response';
import { saveUpload } from '@/lib/upload';
import { logActivity } from '@/lib/activity-log';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const data = await prisma.loanAttachment.findMany({
    where: { loanId: Number(params.id) },
    orderBy: { createdAt: 'desc' },
  });
  return success(data);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) return error('NOT_FOUND', 'Peminjaman tidak ditemukan', 404);

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return error('NO_FILE', 'File tidak ditemukan', 400);

  try {
    const uploaded = await saveUpload(file, 'loan-forms');

    const att = await prisma.loanAttachment.create({
      data: {
        loanId: id,
        filePath: uploaded.filePath,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      },
    });

    await logActivity({
      userId: auth.user.userId,
      action: 'upload',
      module: 'loans',
      referenceId: id,
      description: `Upload form TTD untuk ${loan.code}`,
      req,
    });

    return success(att, 'Form TTD terupload');
  } catch (e: any) {
    return error('UPLOAD_FAILED', e.message || 'Gagal upload', 400);
  }
}
