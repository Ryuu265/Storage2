# Pusat Data Dokumen Perencanaan — Bapperida

Sistem terpadu untuk mengelola dan mengakses dokumen perencanaan daerah dari Google Drive, dengan kontrol akses berbasis peran (RBAC).

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@bapperida.go.id | superadmin123 |
| Admin Perencanaan | admin.perencanaan@bapperida.go.id | admin123 |
| Admin Palev | admin.palev@bapperida.go.id | admin123 |
| Viewer | pegawai@bapperida.go.id | viewer123 |

## Cara Menjalankan

### Cukup 1 Perintah (Menjalankan Backend & Frontend Sekaligus):
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

> *Catatan: Jika ingin menjalankan secara terpisah di 2 terminal:*
> - Terminal 1 (Backend): `npm run server`
> - Terminal 2 (Frontend): `npm run client`

---

## Fitur Utama

### Role-Based Access Control
- **Super Admin**: Kelola semua bidang, user, dan folder. Lihat log aktivitas.
- **Admin Bidang**: Tambah/edit/hapus folder milik bidangnya sendiri.
- **Viewer**: Lihat dan download file dari semua bidang (read-only).

> Proteksi akses ditegakkan di **backend API** — bukan hanya di UI.

### Halaman Dashboard
- **Sidebar**: Navigasi Perencanaan & Palev, plus menu Admin untuk Super Admin
- **Diagram Tahapan**: Alur proses perencanaan (RPJMD → RKPD → Renja → RKA/DPA → Pelaksanaan)
- **Grid Folder**: Kartu folder Google Drive dengan tombol edit/hapus (hanya untuk admin pemilik)
- **Modal File Browser**: Klik folder untuk melihat daftar file di dalamnya

---

## Integrasi Google Drive API (Setup Production)

Saat ini sistem menggunakan **mock data** untuk demo. Untuk koneksi ke Google Drive sungguhan:

### Langkah Setup:

1. **Buka Google Cloud Console**: https://console.cloud.google.com/

2. **Buat project baru** atau gunakan yang ada.

3. **Aktifkan Google Drive API**:
   - Di menu kiri → "APIs & Services" → "Enable APIs and Services"
   - Cari "Google Drive API" → Enable

4. **Buat Service Account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Beri nama (mis. `pusat-data-bapperida`)
   - Di "Keys" → Add Key → JSON → Download file key

5. **Simpan key file** di folder project:
   ```
   service-account-key.json
   ```

6. **Update `.env`**:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account-key.json
   ```

7. **Share folder Google Drive** ke email Service Account:
   - Buka folder di Google Drive
   - Klik "Bagikan" → masukkan email Service Account (mis. `pusat-data@project.iam.gserviceaccount.com`)
   - Beri akses "Viewer"

8. **Aktifkan API di `server/routes/drive.js`**:
   - Hapus komentar pada blok `// PRODUCTION:` dan komentar blok `// DEVELOPMENT:`

---

## Struktur Proyek

```
pusat-data-perencanaan/
├── server/                  # Backend Express
│   ├── index.js             # Entry point
│   ├── db.js                # SQLite database + seed
│   ├── middleware/
│   │   └── auth.js          # JWT + RBAC middleware
│   └── routes/
│       ├── auth.js          # Login endpoint
│       ├── bidang.js        # CRUD bidang
│       ├── users.js         # CRUD user
│       ├── driveLinks.js    # CRUD referensi folder Drive
│       ├── drive.js         # Proxy Google Drive API
│       └── activityLogs.js  # Activity log
├── src/                     # Frontend Vue.js
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js      # Vue Router + guards
│   ├── stores/auth.js       # Pinia auth store
│   ├── layouts/
│   │   └── DashboardLayout.vue  # Sidebar + main layout
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── BidangView.vue   # Halaman utama per bidang
│   │   ├── AdminView.vue    # Manajemen user & bidang
│   │   └── LogsView.vue     # Activity log viewer
│   ├── components/
│   │   └── FolderCard.vue   # Kartu folder Google Drive
│   └── style.css            # Design system (mint/putih)
├── .env                     # Environment variables
├── .env.example             # Template env
└── package.json
```

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | Vue.js 3 + Vite |
| State Management | Pinia |
| Routing | Vue Router 4 |
| HTTP Client | Axios |
| Backend | Express.js (Node.js) |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Google Drive | googleapis (siap diaktifkan) |
| Styling | Vanilla CSS (Design System Mint) |
