import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { success } from '@/lib/response';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const [totalAssets, totalLoans, totalDamages, totalInstalled] = await Promise.all([
    prisma.asset.count(),
    prisma.loan.count({ where: { status: 'aktif' } }),
    prisma.damage.count(),
    prisma.installedAsset.count(),
  ]);

  return success({ totalAssets, totalLoans, totalDamages, totalInstalled });
}
