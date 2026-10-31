# 🔌 API Endpoints (Ringkasan)

Base URL: `http://localhost:3000/api`
Semua endpoint (kecuali login) memerlukan header: `Authorization: Bearer <JWT_TOKEN>`

## 1. Auth
- `POST /auth/login`: Login (body: email, password). Return: token.
- `POST /auth/logout`: Logout.
- `GET /auth/me`: Cek profil user yang sedang login.

## 2. Master Data (Admin Only)
- `GET/POST /divisions`, `PUT/DELETE /divisions/:id`
- `GET/POST /categories`, `PUT/DELETE /categories/:id`
- `GET/POST /employees`, `PUT/DELETE /employees/:id`
- `GET/POST /locations`, `PUT/DELETE /locations/:id`

## 3. Assets
- `GET /assets`: List aset (query: page, limit, search, status, ownership).
- `POST /assets`: Tambah aset baru (body: name, divisionId, categoryId, legacyCode, dll).
- `GET /assets/:id`: Detail aset + riwayat.
- `PUT /assets/:id`: Update aset.
- `DELETE /assets/:id`: Hapus aset (Admin only).
- `GET /assets/:id/qr`: Generate QR Data URL.
- `GET /assets/:id/label`: Halaman HTML Label Print (butuh ?token=JWT).

## 4. Transaksi
- `GET/POST /purchases`: Catat perolehan.
- `GET/POST /loans`: Peminjaman multi-item (body: borrowerName, assetIds[]).
- `PATCH /loans/:id/return`: Tandai aset kembali.
- `POST /loans/:id/attachments`: Upload file TTD (multipart/form-data).
- `GET/POST /damages`: Lapor kerusakan.
- `GET/POST /installed`: Catat pemasangan aset.

## 5. Lainnya
- `GET/POST /templates`: Upload/manage template form.
- `GET /reports/dashboard`: Angka ringkasan dashboard.
- `GET /reports/assets|loans|damages`: Data laporan.
