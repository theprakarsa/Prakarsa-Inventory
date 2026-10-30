import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { generateQrDataUrl } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return new Response('Token required', { status: 401 });

  try {
    verifyToken(token);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: Number(params.id) },
    include: { division: true, category: true },
  });
  if (!asset) return new Response('Asset tidak ditemukan', { status: 404 });

  const qr = await generateQrDataUrl(asset.code);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Label ${asset.code}</title>
<style>
  @page { size: 5cm 4cm; margin: 2mm; }
  body { margin: 0; font-family: -apple-system, Arial, sans-serif; }
  .label {
    width: 5cm; height: 4cm; padding: 3mm; box-sizing: border-box;
    border: 1px solid #ccc; display: flex; flex-direction: column;
    align-items: center; justify-content: space-between; text-align: center;
  }
  .qr { width: 2.2cm; height: 2.2cm; }
  .code { font-size: 8pt; font-weight: bold; font-family: monospace; }
  .name { font-size: 7pt; line-height: 1.2; }
  .sub { font-size: 6pt; color: #666; }
  @media print { .no-print { display: none; } body { margin: 0; } }
</style>
</head>
<body>
<div class="no-print" style="padding:12px;text-align:center;background:#f3f4f6">
  <button onclick="window.print()" style="padding:8px 16px;font-size:14px;cursor:pointer">🖨️ Print</button>
</div>
<div class="label">
  <img src="${qr}" class="qr" alt="QR"/>
  <div class="code">${asset.code}</div>
  <div class="name">${asset.name}</div>
  <div class="sub">${asset.division.code} / ${asset.category.code}</div>
</div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
