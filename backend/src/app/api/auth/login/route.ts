import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  let db;
  try {
    const body = await req.json();
    const { email, password } = body;

    // Koneksi menggunakan DATABASE_URL dari Railway
    db = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const [rows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // Jika password di database masih plain text, gunakan: password === user.password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || "rahasia_default", 
      { expiresIn: "1d" }
    );

    return NextResponse.json({ 
      message: "Login berhasil", 
      token: token,
      user: { id: user.id, email: user.email }
    }, { status: 200 });

  } catch (error: any) {
    console.error("DETAIL ERROR:", error);
    return NextResponse.json({ 
      message: "Terjadi kesalahan server", 
      errorDetail: error.message || String(error)
    }, { status: 500 });
  } finally {
    if (db) await db.end();
  }
}
