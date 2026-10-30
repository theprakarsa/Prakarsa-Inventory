import { NextRequest } from 'next/server';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { error } from '@/lib/response';

export type AuthResult =
  | { ok: true; user: JwtPayload }
  | { ok: false; response: Response };

export function requireAuth(req: NextRequest): AuthResult {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { ok: false, response: error('UNAUTHORIZED', 'Token tidak ada', 401) };
  }
  try {
    const user = verifyToken(auth.slice(7));
    return { ok: true, user };
  } catch {
    return { ok: false, response: error('INVALID_TOKEN', 'Token tidak valid / expired', 401) };
  }
}
