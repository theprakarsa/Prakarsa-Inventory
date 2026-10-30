import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  assetId: z.coerce.number().int().positive(),
  type: z.enum(['hilang', 'rusak_pemakaian', 'rusak_hardware']),
  damageDate: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 10)));
  const type = searchParams.get('type') || '';

  const where: any = {};
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prisma.damage.findMany({
      where,
      include: { asset: { include: { division: true, category: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { damageDate: 'desc' },
    }),
    prisma.damage.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const asset = await prisma.asset.findUnique({ where: { id: v.data.assetId } });
  if (!asset) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);

  const newStatus = v.data.type === 'hilang' ? 'hilang' : 'rusak';

  const damage = await prisma.$transaction(async (tx) => {
    const d = await tx.damage.create({
      data: {
        assetId: v.data.assetId,
        type: v.data.type,
        damageDate: new Date(v.data.damageDate),
        note: v.data.note,
        reportedBy: auth.user.userId,
      },
      include: { asset: true },
    });
    await tx.asset.update({
      where: { id: v.data.assetId },
      data: { status: newStatus as any },
    });
    return d;
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'damages',
    referenceId: damage.id,
    description: `Lapor ${v.data.type} untuk asset ${asset.code}`,
    req,
  });

  return success(damage, 'Laporan kerusakan dibuat');
}
