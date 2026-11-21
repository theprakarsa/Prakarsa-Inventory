import { NextRequest, NextResponse } from 'next/server';

export function requireRole(user: any, allowedRoles: string[]) {
  if (!user) {
    return { ok: false, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  // Ambil role dari user, ubah ke string dan huruf kecil
  const role = String(user.role || '').toLowerCase();
  
  // Anggap '1' atau 'administrator' sebagai 'admin'
  const normalizedRole = (role === '1' || role === 'administrator' || role === 'superadmin') ? 'admin' : role;

  if (!allowedRoles.includes(normalizedRole)) {
    return { ok: false, response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true };
}
