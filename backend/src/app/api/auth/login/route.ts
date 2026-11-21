import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let db;
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    db = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const [rows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    const userName = user.name || user.nama || user.username || "User";
    
    // NORMALISASI ROLE: Jika DB menyimpan angka 1, ubah jadi string 'admin'
    let userRole = String(user.role || user.role_id || user.level || 'staff').toLowerCase();
    if (userRole === '1' || userRole === 'administrator' || userRole === 'superadmin') {
      userRole = 'admin';
    }

    const token = jwt.sign(
      { id: user.id, userId: user.id, email: user.email, role: userRole }, 
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
        role: userRole // Kirim 'admin' ke frontend
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("DETAIL ERROR:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", errorDetail: error.message }, { status: 500 });
  } finally {
    if (db) await db.end();
  }
}
