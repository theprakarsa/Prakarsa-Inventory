import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success, paginated, error } from '@/lib/response';
import { validateBody } from '@/lib/validate';
import { generateLoanCode } from '@/lib/code-generator';
import { logActivity } from '@/lib/activity-log';

const createSchema = z.object({
  borrowerName: z.string().min(1),
  borrowerNik: z.string().min(1),
  loanDate: z.string().min(1),
  dueDate: z.string().optional(),
  templateId: z.coerce.number().int().positive().optional(),
  assetIds: z.array(z.coerce.number().int().positive()).min(1),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 10)));
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { borrowerName: { contains: search } },
      { borrowerNik: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: {
        items: { include: { asset: true } },
        template: true,
        creator: { select: { id: true, name: true } },
        attachments: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.loan.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const v = await validateBody(req, createSchema);
  if (!v.ok) return v.response;

  const loanDate = new Date(v.data.loanDate);

  const assets = await prisma.asset.findMany({
    where: { id: { in: v.data.assetIds } },
    include: { division: true, category: true },
  });

  if (assets.length !== v.data.assetIds.length) {
    return error('NOT_FOUND', 'Beberapa asset tidak ditemukan', 404);
  }

  const notAvailable = assets.filter((a) => a.status !== 'tersedia');
  if (notAvailable.length > 0) {
    return error(
      'NOT_AVAILABLE',
      `Asset tidak tersedia: ${notAvailable.map((a) => a.code).join(', ')}`,
      409
    );
  }

  const code = await generateLoanCode(loanDate);

  const result = await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        code,
        borrowerName: v.data.borrowerName,
        borrowerNik: v.data.borrowerNik,
        loanDate,
        dueDate: v.data.dueDate ? new Date(v.data.dueDate) : null,
        templateId: v.data.templateId,
        createdBy: auth.user.userId,
        note: v.data.note,
        status: 'aktif',
        items: {
          create: v.data.assetIds.map((assetId) => ({ assetId })),
        },
      },
      include: {
        items: { include: { asset: true } },
        template: true,
      },
    });

    await tx.asset.updateMany({
      where: { id: { in: v.data.assetIds } },
      data: { status: 'dipinjam' },
    });

    return loan;
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'create',
    module: 'loans',
    referenceId: result.id,
    description: `Buat peminjaman ${result.code} untuk ${result.borrowerName}`,
    req,
  });

  return success(result, 'Peminjaman dibuat');
}
