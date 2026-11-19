import { NextResponse, NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';
import { validateBody } from '@/lib/validate';

// 1. Definisi Header CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://prakarsa-inventory.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

// 2. Handler untuk Preflight Request (OPTIONS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// 3. Handler untuk Login (POST)
export async function POST(req: NextRequest) {
  try {
    const v = await validateBody(req, loginSchema);
    if (!v.ok) {
      // Pastikan response error dari validasi juga punya header CORS
      const errRes = v.response;
      Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
      return errRes;
    }

    const { email, password } = v.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, employee: true },
    });

    if (!user || !user.isActive) {
      const errRes = error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
      Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
      return errRes;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const errRes = error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
      Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
      return errRes;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    await logActivity({
      userId: user.id,
      action: 'login',
      module: 'auth',
      description: `Login oleh ${user.email}`,
      req,
    });

    const successRes = success(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          employee: user.employee,
        },
      },
      'Login berhasil'
    );

    // Tambahkan header CORS ke response sukses
    Object.entries(corsHeaders).forEach(([key, value]) => successRes.headers.set(key, value));
    return successRes;

  } catch (err) {
    console.error(err);
    const errRes = error('SERVER_ERROR', 'Terjadi kesalahan pada server', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
    return errRes;
  }
}
