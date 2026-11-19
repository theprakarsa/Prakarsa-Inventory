import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401, headers: corsHeaders });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role.name });
    
    return NextResponse.json({ token, user }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}