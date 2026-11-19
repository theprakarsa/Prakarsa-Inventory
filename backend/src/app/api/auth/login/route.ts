import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true, employee: true } });
    
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      return error('INVALID_CREDENTIALS', 'Email atau password salah', 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role.name });
    await logActivity({ userId: user.id, action: 'login', module: 'auth', description: `Login oleh ${user.email}`, req });
    
    return success({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role.name, employee: user.employee } }, 'Login berhasil');

  } catch (err: any) {
    console.error(err);
    return error('SERVER_ERROR', `Server Error: ${err.message || 'Unknown'}`, 500);
  }
}
