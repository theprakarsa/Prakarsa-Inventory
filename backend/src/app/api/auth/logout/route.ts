import { NextRequest } from 'next/server';
import { requireAuth } from '@/middlewares/auth';
import { success } from '@/lib/response';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if (auth.ok) {
    await logActivity({
      userId: auth.user.userId,
      action: 'logout',
      module: 'auth',
      description: `Logout oleh ${auth.user.email}`,
      req,
    });
  }

  return success(null, 'Logout berhasil');
}
