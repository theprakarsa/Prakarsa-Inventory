import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { generateAssetCode } from '@/lib/code-generator';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  name: z.string().min(1),
  divisionId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  ownership: z.string().optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  budgetProject: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 10)));
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const ownership = searchParams.get('ownership') || '';
  const divisionId = searchParams.get('divisionId');
  const categoryId = searchParams.get('categoryId');

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } },
      { serialNumber: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (ownership) where.ownership = { contains: ownership };
  if (divisionId) where.divisionId = Number(divisionId);
  if (categoryId) where.categoryId = Number(categoryId);

  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { division: true, category: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.asset.count({ where }),
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

  const [division, category] = await Promise.all([
    prisma.division.findUnique({ where: { id: v.data.divisionId } }),
    prisma.category.findUnique({ where: { id: v.data.categoryId } }),
  ]);
  if (!division) return error('NOT_FOUND', 'Divisi tidak ditemukan', 404);
  if (!category) return error('NOT_FOUND', 'Kategori tidak ditemukan', 404);

  // KODE OTOMATIS DIBUAT DI SINI
  const code = await generateAssetCode(division.code, category.code);

  const asset = await prisma.asset.create({
    data: {
      code,
      name: v.data.name,
      divisionId: v.data.divisionId,
      categoryId: v.data.categoryId,
      ownership: v.data.ownership,
      brand: v.data.brand,
      serialNumber: v.data.serialNumber,
      price: v.data.price,
      budgetProject: v.data.budgetProject,
      quantity: v.data.quantity,
      note: v.data.note,
      status: 'tersedia',
    },
    include: { division: true, category: true },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'assets',
    referenceId: asset.id,
    description: `Tambah asset ${asset.code} - ${asset.name}`,
    req,
  });

  return success(asset, 'Asset dibuat');
}