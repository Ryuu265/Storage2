const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'pusat-data-bapperida-secret-2025';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      bidang_id: user.bidang_id || null,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin.' });
    }
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  return requireRole('SUPER_ADMIN')(req, res, next);
}

function requireAdminOrAbove(req, res, next) {
  return requireRole('SUPER_ADMIN', 'ADMIN_BIDANG')(req, res, next);
}

// Middleware: cek apakah user adalah pemilik bidang atau super admin
function requireBidangOwnerOrSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Tidak terautentikasi.' });
  if (req.user.role === 'SUPER_ADMIN') return next();
  if (req.user.role === 'ADMIN_BIDANG') {
    // bidang_id dari body atau params akan diperiksa di handler
    return next();
  }
  return res.status(403).json({ error: 'Akses ditolak.' });
}

module.exports = { generateToken, verifyToken, requireRole, requireSuperAdmin, requireAdminOrAbove, requireBidangOwnerOrSuperAdmin };
