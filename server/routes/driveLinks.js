const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireBidangOwnerOrSuperAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/drive-links - semua user bisa akses (list semua link dari semua bidang)
router.get('/', verifyToken, (req, res) => {
  const { bidang_id, search, tahapan_id } = req.query;
  let query = `
    SELECT d.*, b.nama_bidang, t.label AS nama_tahapan
    FROM drive_links d
    JOIN bidang b ON d.bidang_id = b.id
    LEFT JOIN tahapan t ON d.tahapan_id = t.id
  `;
  const params = [];
  const whereClauses = [];

  if (bidang_id) {
    whereClauses.push('d.bidang_id = ?');
    params.push(bidang_id);
  }

  if (tahapan_id) {
    if (tahapan_id === 'umum') {
      whereClauses.push('d.tahapan_id IS NULL');
    } else if (tahapan_id !== 'all') {
      whereClauses.push('d.tahapan_id = ?');
      params.push(tahapan_id);
    }
  }

  if (search) {
    whereClauses.push('(d.nama_folder LIKE ? OR b.nama_bidang LIKE ? OR t.label LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY d.created_at DESC';

  const links = db.prepare(query).all(...params);
  res.json({ links });
});

// POST /api/drive-links - admin bidang & super admin
router.post('/', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const { bidang_id, nama_folder, drive_folder_id, drive_folder_url, tahapan_id } = req.body;

  if (!bidang_id || !nama_folder || !drive_folder_url) {
    return res.status(400).json({ error: 'bidang_id, nama_folder, dan drive_folder_url wajib diisi.' });
  }

  // SECURITY: Admin bidang hanya bisa tambah ke bidangnya sendiri
  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== bidang_id) {
    return res.status(403).json({ error: 'Anda hanya bisa menambahkan folder ke bidang Anda sendiri.' });
  }

  // Validasi bidang ada
  const bidang = db.prepare('SELECT id FROM bidang WHERE id = ?').get(bidang_id);
  if (!bidang) return res.status(404).json({ error: 'Bidang tidak ditemukan.' });

  // Extract folder ID dari URL jika tidak diberikan
  let folderId = drive_folder_id;
  if (!folderId && drive_folder_url) {
    const match = drive_folder_url.match(/(?:folders\/|id=)([a-zA-Z0-9_-]+)/);
    folderId = match ? match[1] : 'unknown-' + uuidv4().slice(0, 8);
  }

  const id = 'link-' + uuidv4().slice(0, 8);
  const finalTahapanId = tahapan_id && tahapan_id !== '' && tahapan_id !== 'umum' ? tahapan_id : null;

  db.prepare(`
    INSERT INTO drive_links (id, bidang_id, nama_folder, drive_folder_id, drive_folder_url, tahapan_id, dibuat_oleh)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, bidang_id, nama_folder, folderId, drive_folder_url, finalTahapanId, req.user.nama);

  db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, target_link_id, detail) VALUES (?,?,?,?,?,?)').run(
    uuidv4(), req.user.id, req.user.nama, 'TAMBAH_FOLDER', id, `Tambah folder: ${nama_folder}`
  );

  res.status(201).json({ message: 'Folder berhasil ditambahkan.', id });
});

// PUT /api/drive-links/:id - hanya pemilik bidang atau super admin
router.put('/:id', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const link = db.prepare('SELECT * FROM drive_links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Folder tidak ditemukan.' });

  // SECURITY: Admin bidang hanya bisa edit milik bidangnya
  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== link.bidang_id) {
    return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengedit folder ini.' });
  }

  const { nama_folder, drive_folder_url, tahapan_id } = req.body;
  const newNama = nama_folder || link.nama_folder;
  const newUrl = drive_folder_url || link.drive_folder_url;

  let newFolderId = link.drive_folder_id;
  if (drive_folder_url) {
    const match = drive_folder_url.match(/(?:folders\/|id=)([a-zA-Z0-9_-]+)/);
    newFolderId = match ? match[1] : link.drive_folder_id;
  }

  let finalTahapanId = link.tahapan_id;
  if (tahapan_id !== undefined) {
    finalTahapanId = tahapan_id && tahapan_id !== '' && tahapan_id !== 'umum' ? tahapan_id : null;
  }

  db.prepare(`
    UPDATE drive_links
    SET nama_folder = ?, drive_folder_url = ?, drive_folder_id = ?, tahapan_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newNama, newUrl, newFolderId, finalTahapanId, req.params.id);

  db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, target_link_id, detail) VALUES (?,?,?,?,?,?)').run(
    uuidv4(), req.user.id, req.user.nama, 'EDIT_FOLDER', req.params.id, `Edit folder: ${newNama}`
  );

  res.json({ message: 'Folder berhasil diperbarui.' });
});

// DELETE /api/drive-links/:id - hanya pemilik bidang atau super admin
router.delete('/:id', verifyToken, requireBidangOwnerOrSuperAdmin, (req, res) => {
  const link = db.prepare('SELECT * FROM drive_links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Folder tidak ditemukan.' });

  // SECURITY: Admin bidang hanya bisa hapus milik bidangnya
  if (req.user.role === 'ADMIN_BIDANG' && req.user.bidang_id !== link.bidang_id) {
    return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus folder ini.' });
  }

  db.prepare('DELETE FROM drive_links WHERE id = ?').run(req.params.id);

  db.prepare('INSERT INTO activity_logs (id, user_id, user_nama, aksi, target_link_id, detail) VALUES (?,?,?,?,?,?)').run(
    uuidv4(), req.user.id, req.user.nama, 'HAPUS_FOLDER', req.params.id, `Hapus folder: ${link.nama_folder}`
  );

  res.json({ message: 'Folder berhasil dihapus.' });
});

module.exports = router;
