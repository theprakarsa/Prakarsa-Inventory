import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!loan) return error('NOT_FOUND', 'Peminjaman tidak ditemukan', 404);
  if (loan.status === 'selesai') {
    return error('ALREADY_DONE', 'Peminjaman sudah selesai', 409);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id },
      data: { status: 'selesai', returnedAt: now },
    });

    await tx.loanItem.updateMany({
      where: { loanId: id, returnedAt: null },
      data: { returnedAt: now },
    });

    await tx.asset.updateMany({
      where: { id: { in: loan.items.map((i) => i.assetId) } },
      data: { status: 'tersedia' },
    });
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'return',
    module: 'loans',
    referenceId: id,
    description: `Kembalikan peminjaman ${loan.code}`,
    req,
  });

  return success(null, 'Asset ditandai kembali');
}
