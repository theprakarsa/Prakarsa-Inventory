import { NextResponse } from "next/server";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "https://app.theprakarsa.org",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
});

// Menangani Preflight Request dari browser
export async function OPTIONS(req: Request) {
  return new NextResponse(null, { 
    status: 204, 
    headers: getCorsHeaders(req.headers.get("origin")) 
  });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  try {
    // --- SILAKAN MASUKKAN LOGIKA LOGIN ANDA DI SINI ---
    // (Pastikan Anda tidak menghapus logika asli Anda yang ada di dalam blok try ini)
    const body = await req.json(); 
    
    const successRes = NextResponse.json({ message: "Login berhasil" }, { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => successRes.headers.set(k, v));
    return successRes;
  } catch (error) {
    const errRes = NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => errRes.headers.set(k, v));
    return errRes;
  }
}
