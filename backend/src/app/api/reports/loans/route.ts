import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { paginated } from '@/lib/response';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = searchParams.get('status') || '';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: any = {};
  if (status) where.status = status;
  if (from || to) {
    where.loanDate = {};
    if (from) where.loanDate.gte = new Date(from);
    if (to) where.loanDate.lte = new Date(to + 'T23:59:59');
  }

  const [data, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: { items: { include: { asset: true } }, creator: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { loanDate: 'desc' },
    }),
    prisma.loan.count({ where }),
  ]);

  return paginated(data, page, limit, total);
}
