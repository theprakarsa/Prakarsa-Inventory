import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Tangani Preflight (OPTIONS) langsung di sini
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://prakarsa-inventory.vercel.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  // 2. Teruskan request biasa, tapi sisipkan header CORS
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', 'https://prakarsa-inventory.vercel.app')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

// 3. Hanya jalankan untuk rute API
export const config = {
  matcher: '/api/:path*',
}
