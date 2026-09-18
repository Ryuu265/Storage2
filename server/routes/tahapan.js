const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireBidangOwnerOrSuperAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/tahapan?bidang_id=...
router.get('/', verifyToken, (req, res) => {
  const { bidang_id } = req.query;
  let query = 'SELECT * FROM tahapan';
  const params = [];

  if (bidang_id) {
    query += ' WHERE bidang_id = ?';
    params.push(bidang_id);
  }

  query += ' ORDER BY urutan ASC, created_at ASC';
  const tahapan = db.prepare(query).all(...params);
  res.json({ tahapan });
});

// POST /api/tahapan - Tambah tahapan baru
router.post('/', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const { bidang_id, label, deskripsi, icon } = req.body;

  if (!bidang_id || !label) {
    return res.status(400).json({ error: 'bidang_id dan label tahapan wajib diisi.' });
  }

  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== bidang_id) {
    return res.status(403).json({ error: 'Anda hanya dapat menambahkan tahapan pada bidang Anda sendiri.' });
  }

  const maxRow = db.prepare('SELECT COALESCE(MAX(urutan), -1) + 1 AS next_urutan FROM tahapan WHERE bidang_id = ?').get(bidang_id);
  const urutan = maxRow.next_urutan;
  const id = 'thp-' + uuidv4().slice(0, 8);
  const iconFinal = icon || '📋';

  db.prepare(`
    INSERT INTO tahapan (id, bidang_id, label, deskripsi, icon, urutan)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, bidang_id, label.trim(), deskripsi ? deskripsi.trim() : '', iconFinal, urutan);

  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    req.user.id,
    req.user.nama,
    'TAMBAH_TAHAPAN',
    `Menambahkan tahapan: "${label.trim()}"`
  );

  const created = db.prepare('SELECT * FROM tahapan WHERE id = ?').get(id);
  res.status(201).json({ tahapan: created });
});

// PUT /api/tahapan/reorder - Mengubah urutan drag & drop
router.put('/reorder', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const { bidang_id, items } = req.body;

  if (!bidang_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'bidang_id dan daftar items wajib diisi.' });
  }

  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== bidang_id) {
    return res.status(403).json({ error: 'Anda hanya dapat mengubah urutan tahapan pada bidang Anda sendiri.' });
  }

  const updateStmt = db.prepare('UPDATE tahapan SET urutan = ? WHERE id = ? AND bidang_id = ?');
  const updateMany = db.transaction((list) => {
    for (const item of list) {
      updateStmt.run(item.urutan, item.id, bidang_id);
    }
  });

  updateMany(items);

  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    req.user.id,
    req.user.nama,
    'UBAH_URUTAN_TAHAPAN',
    `Mengubah urutan tahapan proses perencanaan (${items.length} tahapan)`
  );

  const updated = db.prepare('SELECT * FROM tahapan WHERE bidang_id = ? ORDER BY urutan ASC').all(bidang_id);
  res.json({ success: true, tahapan: updated });
});

// PUT /api/tahapan/:id - Edit nama / deskripsi / icon tahapan
router.put('/:id', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const { id } = req.params;
  const { label, deskripsi, icon } = req.body;

  const current = db.prepare('SELECT * FROM tahapan WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Tahapan tidak ditemukan.' });

  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== current.bidang_id) {
    return res.status(403).json({ error: 'Anda tidak memiliki izin mengubah tahapan bidang ini.' });
  }

  db.prepare(`
    UPDATE tahapan
    SET label = COALESCE(?, label),
        deskripsi = COALESCE(?, deskripsi),
        icon = COALESCE(?, icon)
    WHERE id = ?
  `).run(label?.trim(), deskripsi?.trim(), icon, id);

  const updated = db.prepare('SELECT * FROM tahapan WHERE id = ?').get(id);
  res.json({ tahapan: updated });
});

// DELETE /api/tahapan/:id - Hapus tahapan
router.delete('/:id', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT * FROM tahapan WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Tahapan tidak ditemukan.' });

  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== current.bidang_id) {
    return res.status(403).json({ error: 'Anda tidak memiliki izin menghapus tahapan bidang ini.' });
  }

  db.prepare('DELETE FROM tahapan WHERE id = ?').run(id);

  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (id, user_id, user_nama, aksi, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    req.user.id,
    req.user.nama,
    'HAPUS_TAHAPAN',
    `Menghapus tahapan: "${current.label}"`
  );

  res.json({ success: true, message: 'Tahapan berhasil dihapus.' });
});

module.exports = router;
