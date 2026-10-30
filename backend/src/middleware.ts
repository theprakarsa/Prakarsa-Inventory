import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const IS_LOCKED = process.env.DB_LOCKED === 'true'; // <-- Cek variabel .env

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;

  // Blokir semua aksi modifikasi jika database dikunci
  if (IS_LOCKED) {
    const method = req.method;
    const path = req.nextUrl.pathname;
    
    // Izinkan GET (lihat), OPTIONS (CORS), dan POST ke /auth/login
    const isReadOnly = method === 'GET' || method === 'OPTIONS';
    const isLogin = path.endsWith('/api/auth/login') && method === 'POST';

    if (!isReadOnly && !isLogin) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: { code: 'DB_LOCKED', message: 'Database sedang dikunci (Read-Only). Tidak bisa menambah/mengubah data.' } 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allow } }
      );
    }
  }

  // Handle CORS biasa
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set('Access-Control-Allow-Origin', allow);
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

export const config = { matcher: '/api/:path*' };
