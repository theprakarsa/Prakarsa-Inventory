import { prisma } from './prisma';

export async function generateAssetCode(
  divisionCode: string,
  categoryCode: string
): Promise<string> {
  const prefix = `PRAKARSA-${divisionCode}-${categoryCode}-`;
  const last = await prisma.asset.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let next = 1;
  if (last) {
    const parts = last.code.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `${prefix}${String(next).padStart(3, '0')}`;
}

export async function generateLoanCode(date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `PJM/${year}/${month}/`;

  const last = await prisma.loan.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let next = 1;
  if (last) {
    const parts = last.code.split('/');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `${prefix}${String(next).padStart(4, '0')}`;
}
