import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  assetId: z.coerce.number().int().positive(),
  source: z.enum(['purchase', 'grant']),
  purchaseDate: z.string().min(1),
  warrantyUntil: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 10)));
  const assetId = searchParams.get('assetId');

  const where: any = {};
  if (assetId) where.assetId = Number(assetId);

  const [data, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { asset: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { purchaseDate: 'desc' },
    }),
    prisma.purchase.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) return role.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const asset = await prisma.asset.findUnique({ where: { id: v.data.assetId } });
  if (!asset) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);

  // Gunakan transaksi agar data pembelian dan update harga asset berjalan bersamaan
  const result = await prisma.$transaction(async (tx) => {
    // 1. Catat pembelian
    const purchase = await tx.purchase.create({
      data: {
        assetId: v.data.assetId,
        source: v.data.source,
        purchaseDate: new Date(v.data.purchaseDate),
        warrantyUntil: v.data.warrantyUntil ? new Date(v.data.warrantyUntil) : null,
        price: v.data.price,
        budgetProject: v.data.budgetProject,
        note: v.data.note,
      },
      include: { asset: true },
    });

    // 2. OTOMATIS UPDATE HARGA DI MASTER ASSET
    // Jika user mengisi harga, timpa harga lama di tabel asset
    if (v.data.price !== undefined && v.data.price !== null) {
      await tx.asset.update({
        where: { id: v.data.assetId },
        data: { price: v.data.price },
      });
    }

    return purchase;
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'purchases',
    referenceId: result.id,
    description: `Catat perolehan ${result.source} untuk ${asset.code}`,
    req,
  });

  return success(result, 'Perolehan dicatat & Harga aset diperbarui');
}