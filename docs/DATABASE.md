# 🗄️ Database Schema & Relasi

Aplikasi ini menggunakan MySQL/MariaDB dengan ORM Prisma. Terdapat 15 tabel utama.

## 1. Tabel Utama & Relasi
- **`users` & `roles`**: User memiliki 1 role (admin/staff). Terhubung opsional ke tabel `employees`.
- **`assets`**: Tabel inti. Terhubung ke `divisions` (divisi), `categories` (kategori). Memiliki banyak relasi ke `purchases`, `loan_items`, `damages`, `installed_assets`.
- **`loans`**: Terhubung ke `users` (pembuat), `form_templates` (opsional). Memiliki banyak `loan_items` (multi-item) dan `loan_attachments` (file TTD).
- **`installed_assets`**: Menghubungkan `assets` dengan `locations`.

## 2. Field Penting pada Tabel `assets`
Selain field standar, terdapat field khusus untuk data inventaris legacy:
- `code`: Kode baru (Auto-generate: `PRAKARSA-UMM-ELE-001`).
- `legacyCode`: Kode lama (Manual: `PRA/ELE/001/001/DCK/2019`).
- `ownership`: Pemilik/Pengguna (contoh: `AM`, `BN`, `HR`).
- `specs`: Spesifikasi panjang (RAM, SSD, dll).
- `depreciation`: Nilai penyusutan (Decimal).
- `quantity`: Jumlah unit (Integer, default 1).
- `auctionStatus`: Status lelang (`none`, `lelang`, `diambil`).

## 3. Kode Unik & Auto-Increment
- **Asset Code:** `PRAKARSA-{KODE_DIVISI}-{KODE_KATEGORI}-{URUTAN_3_DIGIT}`
- **Loan Code:** `PJM/{TAHUN}/{BULAN}/{URUTAN_4_DIGIT}`
