import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return new Response('Token required', { status: 401 });
  try {
    verifyToken(token);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const template = await prisma.formTemplate.findUnique({ where: { id: Number(params.id) } });
  if (!template) return new Response('Template tidak ditemukan', { status: 404 });

  const filepath = path.join(process.env.UPLOAD_DIR || './uploads', template.filePath);
  try {
    const file = await fs.readFile(filepath);
    return new Response(file, {
      headers: {
        'Content-Type': template.mimeType,
        'Content-Disposition': `inline; filename="${template.fileName}"`,
      },
    });
  } catch {
    return new Response('File tidak ditemukan', { status: 404 });
  }
}
