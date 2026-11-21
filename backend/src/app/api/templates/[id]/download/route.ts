import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    let token = searchParams.get('token');
    
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET || 'rahasia_default');
    
    const id = Number(params.id);
    const template = await prisma.formTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ message: 'Template tidak ditemukan' }, { status: 404, headers: corsHeaders });
    }

    // Baca file fisik dari folder uploads
    const filePath = path.join(process.cwd(), template.filePath);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'File fisik tidak ditemukan di server' }, { status: 404, headers: corsHeaders });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': template.mimeType,
        'Content-Disposition': `attachment; filename="${template.fileName}"`,
      },
    });

    return response;

  } catch (error: any) {
    return NextResponse.json({ message: 'Token tidak valid atau error server', error: error.message }, { status: 401, headers: corsHeaders });
  }
}
