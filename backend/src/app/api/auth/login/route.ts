import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    
    // --- SILAKAN MASUKKAN LOGIKA LOGIN ASLI ANDA DI SINI ---
    // Contoh:
    // const user = await db.user.findUnique({ where: { email: body.email } });
    // if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 401 });

    return NextResponse.json({ message: "Login berhasil" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
