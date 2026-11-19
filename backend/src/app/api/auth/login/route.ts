import { NextResponse, NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';
import { validateBody } from '@/lib/validate';

const allowedOrigins = [
  "https://prakarsa-inventory.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

// Fungsi helper untuk header CORS
const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const v = await validateBody(req, loginSchema);
    if (!v.ok) {
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

    Object.entries(corsHeaders).forEach(([key, value]) => successRes.headers.set(key, value));
    return successRes;

  } catch (err) {
    console.error(err);
    const errRes = error('SERVER_ERROR', 'Terjadi kesalahan pada server', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
    return errRes;
  }
}
