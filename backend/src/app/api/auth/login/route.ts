import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  let db;
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    // 1. Koneksi ke Database MySQL Railway
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME,
      port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false } // Tambahan untuk Railway MySQL
    });

    // 2. Cari user berdasarkan email
    const [rows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // 3. Cek Password (Ganti dengan password === user.password jika tidak pakai bcrypt)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // 4. Buat Token
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
    // Mencetak detail error yang sebenarnya
    console.error("DETAIL ERROR DATABASE:", error);
    return NextResponse.json({ 
      message: "Terjadi kesalahan server", 
      errorDetail: error.message || error.code || String(error)
    }, { status: 500 });
  } finally {
    if (db) await db.end();
  }
}
