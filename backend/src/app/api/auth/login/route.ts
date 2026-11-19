import { NextResponse } from "next/server";
import { NextRequest } from "next/server"; // <-- Memperbaiki import NextRequest
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) { // <-- Memperbaiki tipe parameter menjadi NextRequest
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true, employee: true } });
    
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      const errRes = error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
      Object.entries(corsHeaders).forEach(([k, v]) => errRes.headers.set(k, v));
      return errRes;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role.name });
    await logActivity({ userId: user.id, action: 'login', module: 'auth', description: `Login oleh ${user.email}`, req }); // <-- Sekarang req bertipe NextRequest, logActivity akan menerimanya
    
    const successRes = success({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role.name, employee: user.employee } }, 'Login berhasil');
    Object.entries(corsHeaders).forEach(([k, v]) => successRes.headers.set(k, v));
    return successRes;

  } catch (err: any) {
    const errRes = error('SERVER_ERROR', `Server Error: ${err.message || 'Unknown'}`, 500);
    Object.entries(corsHeaders).forEach(([k, v]) => errRes.headers.set(k, v));
    return errRes;
  }
}
