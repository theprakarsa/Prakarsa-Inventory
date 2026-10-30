import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const data = await prisma.loan.findUnique({
    where: { id: Number(params.id) },
    include: {
      items: { include: { asset: { include: { division: true, category: true } } } },
      template: true,
      creator: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
  });

  if (!data) return error('NOT_FOUND', 'Peminjaman tidak ditemukan', 404);
  return success(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.loan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return error('NOT_FOUND', 'Peminjaman tidak ditemukan', 404);

  await prisma.$transaction(async (tx) => {
    // Kembalikan asset ke tersedia
    await tx.asset.updateMany({
      where: { id: { in: existing.items.map((i) => i.assetId) } },
      data: { status: 'tersedia' },
    });
    await tx.loan.delete({ where: { id } });
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'loans',
    referenceId: id,
    description: `Hapus peminjaman ${existing.code}`,
    req,
  });

  return success(null, 'Peminjaman dihapus');
}
