const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'pusat_data.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS bidang (
    id TEXT PRIMARY KEY,
    nama_bidang TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','ADMIN_BIDANG','VIEWER')),
    bidang_id TEXT REFERENCES bidang(id) ON DELETE SET NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS drive_links (
    id TEXT PRIMARY KEY,
    bidang_id TEXT NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
    nama_folder TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL,
    drive_folder_url TEXT NOT NULL,
    tahapan_id TEXT REFERENCES tahapan(id) ON DELETE SET NULL,
    dibuat_oleh TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_nama TEXT NOT NULL,
    aksi TEXT NOT NULL,
    target_link_id TEXT,
    detail TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tahapan (
    id TEXT PRIMARY KEY,
    bidang_id TEXT NOT NULL REFERENCES bidang(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    deskripsi TEXT,
    icon TEXT DEFAULT '📋',
    urutan INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrasi aman untuk database yang sudah ada jika belum ada kolom tahapan_id
try {
  db.prepare("ALTER TABLE drive_links ADD COLUMN tahapan_id TEXT REFERENCES tahapan(id) ON DELETE SET NULL").run();
} catch (err) {
  // Kolom sudah ada
}

// Seed data jika belum ada
function seed() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c > 0) return;

  // Seed bidang
  const bidang1Id = 'bidang-perencanaan-001';
  const bidang2Id = 'bidang-palev-002';

  db.prepare('INSERT OR IGNORE INTO bidang (id, nama_bidang) VALUES (?, ?)').run(bidang1Id, 'Perencanaan');
  db.prepare('INSERT OR IGNORE INTO bidang (id, nama_bidang) VALUES (?, ?)').run(bidang2Id, 'Pengendalian & Evaluasi (Palev)');

  // Seed users
  const hashSuperAdmin = bcrypt.hashSync('superadmin123', 10);
  const hashAdmin1 = bcrypt.hashSync('admin123', 10);
  const hashAdmin2 = bcrypt.hashSync('admin123', 10);
  const hashViewer = bcrypt.hashSync('viewer123', 10);

  db.prepare('INSERT OR IGNORE INTO users (id, nama, email, password, role, bidang_id) VALUES (?,?,?,?,?,?)').run(
    'user-super-001', 'Super Admin', 'superadmin@bapperida.go.id', hashSuperAdmin, 'SUPER_ADMIN', null
  );
  db.prepare('INSERT OR IGNORE INTO users (id, nama, email, password, role, bidang_id) VALUES (?,?,?,?,?,?)').run(
    'user-admin-perencanaan', 'Admin Perencanaan', 'admin.perencanaan@bapperida.go.id', hashAdmin1, 'ADMIN_BIDANG', bidang1Id
  );
  db.prepare('INSERT OR IGNORE INTO users (id, nama, email, password, role, bidang_id) VALUES (?,?,?,?,?,?)').run(
    'user-admin-palev', 'Admin Palev', 'admin.palev@bapperida.go.id', hashAdmin2, 'ADMIN_BIDANG', bidang2Id
  );
  db.prepare('INSERT OR IGNORE INTO users (id, nama, email, password, role, bidang_id) VALUES (?,?,?,?,?,?)').run(
    'user-viewer-001', 'Pegawai Umum', 'pegawai@bapperida.go.id', hashViewer, 'VIEWER', null
  );

  // Seed mock drive links untuk Perencanaan
  db.prepare('INSERT OR IGNORE INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, dibuat_oleh) VALUES (?,?,?,?,?,?)').run(
    'link-001', bidang1Id, 'RPJMD 2025-2029', 'mock-folder-001', 'https://drive.google.com/drive/folders/mock-001', 'Admin Perencanaan'
  );
  db.prepare('INSERT OR IGNORE INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, dibuat_oleh) VALUES (?,?,?,?,?,?)').run(
    'link-002', bidang1Id, 'RKPD 2025', 'mock-folder-002', 'https://drive.google.com/drive/folders/mock-002', 'Admin Perencanaan'
  );
  db.prepare('INSERT OR IGNORE INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, dibuat_oleh) VALUES (?,?,?,?,?,?)').run(
    'link-003', bidang1Id, 'Renja OPD 2025', 'mock-folder-003', 'https://drive.google.com/drive/folders/mock-003', 'Admin Perencanaan'
  );

  // Seed mock drive links untuk Palev
  db.prepare('INSERT OR IGNORE INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, dibuat_oleh) VALUES (?,?,?,?,?,?)').run(
    'link-004', bidang2Id, 'Laporan Evaluasi Q1 2025', 'mock-folder-004', 'https://drive.google.com/drive/folders/mock-004', 'Admin Palev'
  );
  db.prepare('INSERT OR IGNORE INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, dibuat_oleh) VALUES (?,?,?,?,?,?)').run(
    'link-005', bidang2Id, 'Monev RPJMD 2024', 'mock-folder-005', 'https://drive.google.com/drive/folders/mock-005', 'Admin Palev'
  );

  console.log('✅ Database seeded successfully');
}

function seedTahapan() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM tahapan').get();
  if (existing.c > 0) return;

  const bidang1Id = 'bidang-perencanaan-001';
  const bidang2Id = 'bidang-palev-002';

  const tahapanPerencanaan = [
    { id: 'thp-p-1', label: 'RPJMD', deskripsi: 'Rencana Pembangunan Jangka Menengah Daerah', icon: '📋', urutan: 0 },
    { id: 'thp-p-2', label: 'RKPD', deskripsi: 'Rencana Kerja Pemerintah Daerah', icon: '📅', urutan: 1 },
    { id: 'thp-p-3', label: 'Renja OPD', deskripsi: 'Rencana Kerja OPD/SKPD', icon: '📄', urutan: 2 },
    { id: 'thp-p-4', label: 'RKA/DPA', deskripsi: 'Rencana Kerja Anggaran & Dokumen Pelaksanaan', icon: '💰', urutan: 3 },
    { id: 'thp-p-5', label: 'Pelaksanaan', deskripsi: 'Implementasi & Monitoring Program', icon: '✅', urutan: 4 },
  ];

  const tahapanPalev = [
    { id: 'thp-v-1', label: 'Monitoring Renja', deskripsi: 'Pemantauan Berkala Triwulan', icon: '🔍', urutan: 0 },
    { id: 'thp-v-2', label: 'Evaluasi RKPD', deskripsi: 'Penilaian Capaian Target Kinerja', icon: '📊', urutan: 1 },
    { id: 'thp-v-3', label: 'Laporan LKPJ', deskripsi: 'Laporan Keterangan Pertanggungjawaban', icon: '📑', urutan: 2 },
    { id: 'thp-v-4', label: 'Rekomendasi Palev', deskripsi: 'Tindak Lanjut & Umpan Balik', icon: '💡', urutan: 3 },
  ];

  const insertStmt = db.prepare('INSERT OR IGNORE INTO tahapan (id, bidang_id, label, deskripsi, icon, urutan) VALUES (?,?,?,?,?,?)');
  for (const t of tahapanPerencanaan) {
    insertStmt.run(t.id, bidang1Id, t.label, t.deskripsi, t.icon, t.urutan);
  }
  for (const t of tahapanPalev) {
    insertStmt.run(t.id, bidang2Id, t.label, t.deskripsi, t.icon, t.urutan);
  }
  console.log('✅ Tahapan seeded successfully');
}

function seedSettings() {
  const defaults = [
    { key: 'keepalive_active', value: '1' },
    { key: 'keepalive_interval', value: '10' },
    { key: 'keepalive_schedule_enabled', value: '1' },
    { key: 'keepalive_work_start', value: '08:00' },
    { key: 'keepalive_work_end', value: '17:00' },
    { key: 'keepalive_last_ping', value: '' },
    { key: 'keepalive_last_status', value: 'Belum ada ping' },
    { key: 'keepalive_ping_count', value: '0' },
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const item of defaults) {
    stmt.run(item.key, item.value);
  }
}

seed();
seedTahapan();
seedSettings();

module.exports = db;
