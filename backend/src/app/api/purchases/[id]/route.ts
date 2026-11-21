import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const updateSchema = z.object({
  source: z.enum(['purchase', 'grant']).optional(),
  purchaseDate: z.string().optional(),
  warrantyUntil: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, updateSchema);
  if (!v.ok) return v.response;

  const id = Number(params.id);
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Data pembelian tidak ditemukan', 404);

  const updateData: any = {};
  if (v.data.source !== undefined) updateData.source = v.data.source;
  if (v.data.purchaseDate !== undefined) updateData.purchaseDate = new Date(v.data.purchaseDate);
  if (v.data.warrantyUntil !== undefined) updateData.warrantyUntil = v.data.warrantyUntil ? new Date(v.data.warrantyUntil) : null;
  if (v.data.price !== undefined) updateData.price = v.data.price;
  if (v.data.budgetProject !== undefined) updateData.budgetProject = v.data.budgetProject;
  if (v.data.note !== undefined) updateData.note = v.data.note;

  // Gunakan transaksi agar update pembelian dan harga asset sinkron
  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.update({
      where: { id },
      data: updateData,
    });

    // Jika harga diubah, update juga harga di master Asset
    if (v.data.price !== undefined && v.data.price !== null) {
      await tx.asset.update({
        where: { id: purchase.assetId },
        data: { price: v.data.price },
      });
    }

    return purchase;
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'purchases',
    referenceId: id,
    description: `Update data pembelian ID ${id}`,
    req,
  });

  return success(result, 'Data pembelian diupdate');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const id = Number(params.id);
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) return error('NOT_FOUND', 'Data pembelian tidak ditemukan', 404);

  await prisma.purchase.delete({ where: { id } });

  await logActivity({
    userId: auth.user.userId,
    action: 'delete',
    module: 'purchases',
    referenceId: id,
    description: `Hapus data pembelian ID ${id}`,
    req,
  });

  return success(null, 'Data pembelian dihapus');
}
