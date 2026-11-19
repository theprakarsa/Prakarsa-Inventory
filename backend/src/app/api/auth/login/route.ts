import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    // Kita hanya mencari user, tidak perlu bcrypt dulu
    const user = await prisma.user.findUnique({ where: { email } });
    
    return NextResponse.json(
      { success: true, message: "Koneksi DB Berhasil", user },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error: any) {
    // TAMPILKAN ERROR ASLI
    return NextResponse.json(
      { success: false, error: error.message || "Unknown Error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
