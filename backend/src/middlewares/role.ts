import { JwtPayload } from '@/lib/jwt';
import { error } from '@/lib/response';

export type RoleResult = { ok: true } | { ok: false; response: Response };

export function requireRole(user: JwtPayload, roles: Array<'admin' | 'staff'>): RoleResult {
  if (!roles.includes(user.role as 'admin' | 'staff')) {
    return { ok: false, response: error('FORBIDDEN', 'Tidak punya izin', 403) };
  }
  return { ok: true };
}
