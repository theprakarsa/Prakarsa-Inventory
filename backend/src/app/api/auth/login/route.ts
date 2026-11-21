import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    // 1. Koneksi ke Database MySQL Railway
    const db = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME,
      port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || "3306"),
    });

    // 2. Cari user berdasarkan email (Sesuaikan nama tabel 'users' dan kolomnya dengan DB Anda)
    const [rows]: any = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    // Jika user tidak ditemukan
    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // 3. Cek Password
    // CATATAN: Jika password di DB masih teks biasa (misal "Barkah123@@"), ganti baris bcrypt di bawah dengan:
    // const isMatch = password === user.password;
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    // 4. Buat Token (JWT) agar frontend bisa login
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || "rahasia_default", 
      { expiresIn: "1d" }
    );

    // 5. Kembalikan data ke frontend
    return NextResponse.json({ 
      message: "Login berhasil", 
      token: token,
      user: { id: user.id, email: user.email, name: user.name || user.nama } // sesuaikan kolom DB
    }, { status: 200 });

  } catch (error: any) {
    console.error("Database Error:", error.message);
    return NextResponse.json({ message: "Terjadi kesalahan server: " + error.message }, { status: 500 });
  }
}
