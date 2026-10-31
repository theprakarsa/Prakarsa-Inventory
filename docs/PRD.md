# 📘 PRD — ThePrakarsa Inventory (Ringkas)
**Versi:** 1.1 | **Status:** Production Ready

## 1. Ringkasan
Aplikasi web internal untuk mengelola siklus hidup aset (pembelian, peminjaman, pemasangan, kerusakan) dengan sistem auto-kode, cetak QR, dan audit trail.

## 2. Ruang Lingkup (In Scope)
- Auth (JWT), Role (Admin/Staff).
- Master Data: Divisi, Kategori, Karyawan, Lokasi.
- Aset: Auto kode (PRAKARSA-UMM-ELE-001), Legacy Code, QR Label 5x4 cm.
- Transaksi: Pembelian, Peminjaman (multi-item + upload TTD), Kerusakan, Instalasi.
- Manajemen: Template Form, Users (Reset Pass), Activity Log.
- Laporan: Asset, Peminjaman, Kerusakan (Print).

## 3. Alur Bisnis Utama
- **Login:** JWT disimpan di localStorage.
- **Aset Baru:** Isi form -> Sistem buat kode otomatis -> Simpan -> Print QR.
- **Peminjaman:** Pilih aset (multi) -> Simpan -> Status jadi `dipinjam` -> Upload scan form TTD -> Kembalikan aset.
- **Kerusakan:** Lapor -> Status aset otomatis berubah (rusak/hilang).

## 4. Kebutuhan Fungsional (FR)
- **AUTH:** Login, Expiry 1 hari, Blokir user nonaktif.
- **MASTER DATA:** CRUD Divisi, Kategori, Karyawan, Lokasi (Admin only).
- **ASSETS:** List, Filter, Create (Auto Code), QR & Print Label, Detail & Riwayat.
- **LOANS:** Multi-item, Auto kode (PJM/2026/10/001), Upload PDF/JPG max 10MB, Return asset.
- **DAMAGES:** Lapor (Hilang, Rusak Pemakaian, Rusak Hardware).
- **REPORTS:** Filter tanggal/status, Export/Print.
- **LOGS:** Mencatat semua aktivitas CRUD & Login.

## 5. Kebutuhan Non-Fungsional (NFR)
- **Keamanan:** Hash bcrypt, JWT Secret 32 char, CORS Whitelist, Prisma (Anti SQLi), RBAC di setiap endpoint.
- **Performa:** Login < 3s, List < 2s.
- **UI/UX:** Responsif (Mobile Sidebar Drawer), Bahasa Indonesia, Toast & Confirm Dialog.

## 6. Arsitektur & Stack
- **Backend:** Next.js 14 (API), Prisma 5, MySQL.
- **Frontend:** React 18, Vite, Tailwind CSS.
- **Library:** JWT, Zod, QRCode.

## 7. Database (15 Tabel)
- `users`, `roles`, `activity_logs`
- `divisions`, `categories`, `employees`, `locations`
- `assets`, `purchases`, `loans`, `loan_items`, `loan_attachments`, `damages`, `installed_assets`, `form_templates`
- **Field Spesial `assets`:** `legacyCode`, `ownership`, `specs`, `depreciation`, `auctionStatus`, `quantity`.

## 8. Kriteria Penerimaan (DoD)
- [x] Semua API terlindungi JWT & RBAC.
- [x] 230+ data aset (legacy) berhasil di-import.
- [x] QR Label & Print Laporan berfungsi.
- [x] UI Responsif (Desktop & Mobile).
- [x] Berhasil deploy (internal/hosting).

## 9. Environment Variables
**Backend `.env`:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=1d`, `PORT=3000`, `CORS_ORIGIN`, `UPLOAD_DIR`.
**Frontend `.env`:** `VITE_API_URL`, `VITE_UPLOAD_URL`.

## 10. Akun Default
- Email: `admin@prakarsa.local`
- Pass: `admin123`
