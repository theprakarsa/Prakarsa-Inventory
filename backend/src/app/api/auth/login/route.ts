import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';
import { validateBody } from '@/lib/validate';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const v = await validateBody(req, loginSchema);
  if (!v.ok) return v.response;

  const { email, password } = v.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, employee: true },
  });

  if (!user || !user.isActive) {
    return error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
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

  return success(
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
}
