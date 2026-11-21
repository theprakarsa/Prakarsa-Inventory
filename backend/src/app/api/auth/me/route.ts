import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  let db;
  try {
    // 1. Ambil token dari header Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // 2. Verifikasi token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "rahasia_default");

    // 3. Ambil data terbaru dari database berdasarkan ID di token
    db = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const [rows]: any = await db.execute("SELECT * FROM users WHERE id = ?", [decoded.id]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    // 4. Format data dan kirimkan
    const userName = user.name || user.nama || user.username || "User";
    const userRole = user.role || user.role_id || user.level || "staff";

    return NextResponse.json({ 
      data: {
        id: user.id, 
        name: userName, 
        email: user.email,
        role: userRole
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("ME ERROR:", error);
    // Jika token tidak valid/expired
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  } finally {
    if (db) await db.end();
  }
}
