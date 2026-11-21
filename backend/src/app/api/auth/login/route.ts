import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Fungsi untuk membuat header CORS
const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
});

// Menangani Preflight Request (OPTIONS)
export async function OPTIONS(req: Request) {
  return new NextResponse(null, { 
    status: 204, 
    headers: getCorsHeaders(req.headers.get("origin")) 
  });
}

// Menangani Login (POST)
export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  let db;
  
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400, headers: corsHeaders });
    }

    db = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const [rows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401, headers: corsHeaders });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401, headers: corsHeaders });
    }

    const userName = user.name || user.nama || user.username || "User";
    const userRole = user.role || user.role_id || user.level || "staff";

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole }, 
      process.env.JWT_SECRET || "rahasia_default", 
      { expiresIn: "1d" }
    );

    return NextResponse.json({ 
      message: "Login berhasil", 
      token: token,
      user: { 
        id: user.id, 
        name: userName, 
        email: user.email,
        role: userRole
      }
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("DETAIL ERROR:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", errorDetail: error.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (db) await db.end();
  }
}
