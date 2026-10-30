import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, error } from '@/lib/response';
import { generateQrDataUrl } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const asset = await prisma.asset.findUnique({ where: { id: Number(params.id) } });
  if (!asset) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);

  const dataUrl = await generateQrDataUrl(asset.code);
  return success({ code: asset.code, dataUrl });
}
