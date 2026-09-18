const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi.' });
  }

  const user = db.prepare(`
    SELECT u.*, b.nama_bidang FROM users u
    LEFT JOIN bidang b ON u.bidang_id = b.id
    WHERE u.email = ? AND u.active = 1
  `).get(email);

  if (!user) {
    return res.status(401).json({ error: 'Email tidak ditemukan atau akun dinonaktifkan.' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Password salah.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      bidang_id: user.bidang_id,
      nama_bidang: user.nama_bidang || null,
    }
  });
});

// POST /api/auth/me - verify token & get current user info
router.get('/me', require('../middleware/auth').verifyToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.nama, u.email, u.role, u.bidang_id, b.nama_bidang
    FROM users u LEFT JOIN bidang b ON u.bidang_id = b.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  res.json({ user });
});

module.exports = router;
