import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { generateQrDataUrl } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return new Response('Token required', { status: 401 });

  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return new Response('Akses Ditolak: Hanya Admin yang bisa mencetak label', { status: 403 });
    }
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
  /* Mengatur ukuran kertas pas 5x4 cm */
  @page { 
    size: 50mm 40mm; 
    margin: 0; 
  }
  body { 
    margin: 0; 
    font-family: Arial, sans-serif; 
    background: #fff;
  }
  
  /* Container label */
  .label {
    width: 50mm; 
    height: 40mm; 
    padding: 2mm; 
    box-sizing: border-box;
    border: 1px solid #ccc; 
    display: flex; 
    flex-direction: column;
    align-items: center; 
    justify-content: center; 
    text-align: center;
    overflow: hidden;
  }
  
  /* Ukuran QR Code diperkecil */
  .qr { 
    width: 20mm; 
    height: 20mm; 
    margin-bottom: 2mm;
  }
  
  /* Ukuran Teks */
  .code { 
    font-size: 9px; 
    font-weight: bold; 
    font-family: monospace; 
    line-height: 1.1;
  }
  .name { 
    font-size: 8px; 
    line-height: 1.1; 
    margin-top: 1px;
  }
  .sub { 
    font-size: 6px; 
    color: #666; 
    margin-top: 1px;
  }

  /* Sembunyikan tombol saat dicetak */
  @media print { 
    .no-print { display: none; } 
    body { margin: 0; } 
  }
</style>
</head>
<body>
  <!-- Tombol Print -->
  <div class="no-print" style="padding:8px;text-align:center;background:#f3f4f6">
    <button onclick="window.print()" style="padding:6px 12px;font-size:12px;cursor:pointer">🖨️ Print Label</button>
  </div>

  <!-- Isi Label -->
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