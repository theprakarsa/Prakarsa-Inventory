import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middlewares/auth';
import { requireRole } from '@/middlewares/role';
import { success, error } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

// Header CORS Manual
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Tangani Preflight (OPTIONS) - INI YANG PALING PENTING
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth.ok) {
    Object.entries(corsHeaders).forEach(([k, v]) => auth.response.headers.set(k, v));
    return auth.response;
  }
  
  const role = requireRole(auth.user, ['admin']);
  if (!role.ok) {
    Object.entries(corsHeaders).forEach(([k, v]) => role.response.headers.set(k, v));
    return role.response;
  }

  const id = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const errRes = error('NOT_FOUND', 'User tidak ditemukan', 404);
    Object.entries(corsHeaders).forEach(([k, v]) => errRes.headers.set(k, v));
    return errRes;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  await logActivity({
    userId: auth.user.userId,
    action: 'update',
    module: 'users',
    referenceId: id,
    description: `${updated.isActive ? 'Aktifkan' : 'Nonaktifkan'} user ${updated.email}`,
    req,
  });

  const res = success({ id: updated.id, isActive: updated.isActive }, 'Status user diubah');
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
