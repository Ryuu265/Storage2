const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/bidang - semua user bisa akses (public info)
router.get('/', verifyToken, (req, res) => {
  const bidangs = db.prepare(`
    SELECT b.*, COUNT(d.id) as jumlah_folder
    FROM bidang b
    LEFT JOIN drive_links d ON b.id = d.bidang_id
    GROUP BY b.id
    ORDER BY b.created_at ASC
  `).all();
  res.json({ bidangs });
});

// POST /api/bidang - super admin only
router.post('/', verifyToken, requireSuperAdmin, (req, res) => {
  const { nama_bidang } = req.body;
  if (!nama_bidang || !nama_bidang.trim()) {
    return res.status(400).json({ error: 'Nama bidang tidak boleh kosong.' });
  }

  const id = 'bidang-' + uuidv4().slice(0, 8);
  try {
    db.prepare('INSERT INTO bidang (id, nama_bidang) VALUES (?, ?)').run(id, nama_bidang.trim());

    // Log activity
    db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail) VALUES (?,?,?,?,?)').run(
      uuidv4(), req.user.id, req.user.nama, 'TAMBAH_BIDANG', `Tambah bidang: ${nama_bidang}`
    );

    res.status(201).json({ message: 'Bidang berhasil ditambahkan.', id });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Nama bidang sudah ada.' });
    }
    res.status(500).json({ error: 'Gagal menambah bidang.' });
  }
});

// PUT /api/bidang/:id - super admin only
router.put('/:id', verifyToken, requireSuperAdmin, (req, res) => {
  const { nama_bidang } = req.body;
  if (!nama_bidang || !nama_bidang.trim()) {
    return res.status(400).json({ error: 'Nama bidang tidak boleh kosong.' });
  }

  const existing = db.prepare('SELECT id FROM bidang WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bidang tidak ditemukan.' });

  try {
    db.prepare('UPDATE bidang SET nama_bidang = ? WHERE id = ?').run(nama_bidang.trim(), req.params.id);

    db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail) VALUES (?,?,?,?,?)').run(
      uuidv4(), req.user.id, req.user.nama, 'EDIT_BIDANG', `Edit bidang ID: ${req.params.id}`
    );

    res.json({ message: 'Bidang berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui bidang.' });
  }
});

// DELETE /api/bidang/:id - super admin only
router.delete('/:id', verifyToken, requireSuperAdmin, (req, res) => {
  const existing = db.prepare('SELECT id, nama_bidang FROM bidang WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bidang tidak ditemukan.' });

  db.prepare('DELETE FROM bidang WHERE id = ?').run(req.params.id);

  db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail) VALUES (?,?,?,?,?)').run(
    uuidv4(), req.user.id, req.user.nama, 'HAPUS_BIDANG', `Hapus bidang: ${existing.nama_bidang}`
  );

  res.json({ message: 'Bidang berhasil dihapus.' });
});

module.exports = router;
