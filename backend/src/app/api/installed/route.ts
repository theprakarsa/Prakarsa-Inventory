import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  assetId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  installedAt: z.string().min(1),
  installedBy: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 10)));
  const locationId = searchParams.get('locationId');

  const where: any = {};
  if (locationId) where.locationId = Number(locationId);

  const [data, total] = await Promise.all([
    prisma.installedAsset.findMany({
      where,
      include: {
        asset: { include: { division: true, category: true } },
        location: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { installedAt: 'desc' },
    }),
    prisma.installedAsset.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const [asset, location] = await Promise.all([
    prisma.asset.findUnique({ where: { id: v.data.assetId } }),
    prisma.location.findUnique({ where: { id: v.data.locationId } }),
  ]);
  if (!asset) return error('NOT_FOUND', 'Asset tidak ditemukan', 404);
  if (!location) return error('NOT_FOUND', 'Lokasi tidak ditemukan', 404);

  const installed = await prisma.$transaction(async (tx) => {
    const i = await tx.installedAsset.create({
      data: {
        assetId: v.data.assetId,
        locationId: v.data.locationId,
        installedAt: new Date(v.data.installedAt),
        installedBy: v.data.installedBy,
        note: v.data.note,
      },
      include: { asset: true, location: true },
    });
    await tx.asset.update({
      where: { id: v.data.assetId },
      data: { status: 'terpasang' },
    });
    return i;
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'installed',
    referenceId: installed.id,
    description: `Pasang asset ${asset.code} di ${location.name}`,
    req,
  });

  return success(installed, 'Asset terpasang dicatat');
}
