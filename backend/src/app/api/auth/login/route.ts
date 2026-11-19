import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

// Izinkan localhost dan semua domain yang berakhiran .vercel.app
const isAllowedOrigin = (origin: string) => {
  return origin === "http://localhost:5173" || 
         origin === "http://localhost:3000" ||
         /^https:\/\/.*\.vercel\.app$/.test(origin);
};

const getCorsHeaders = (origin: string | null) => {
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
};

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      const errRes = error('BAD_REQUEST', 'Email dan password harus diisi', 400);
      Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
      return errRes;
    }

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

  } catch (err: any) {
    console.error("LOGIN ERROR:", err.message || err);
    const errRes = error('SERVER_ERROR', `Server Error: ${err.message || 'Unknown'}`, 500);
    Object.entries(corsHeaders).forEach(([key, value]) => errRes.headers.set(key, value));
    return errRes;
  }
}
