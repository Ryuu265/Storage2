const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Readable } = require('stream');

const SERVICE_ACCOUNT_EMAIL = 'drivereader@quiet-engine-507202-a5.iam.gserviceaccount.com';
let driveClient = null;

// Multer: simpan file di memori (bukan disk) untuk langsung di-stream ke Drive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // maks 100 MB
});

function findKeyPath() {
  const candidatePaths = [
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE && path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE),
    path.resolve(process.cwd(), 'service-account-key.json'),
    path.resolve(__dirname, '../../service-account-key.json'),
    path.resolve(__dirname, '../service-account-key.json'),
  ].filter(Boolean);
  return candidatePaths.find(p => fs.existsSync(p));
}

function getDriveClient() {
  if (driveClient) return driveClient;
  const keyPath = findKeyPath();
  if (keyPath) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        // Scope penuh — diperlukan untuk create folder & upload file
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      driveClient = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive API initialized with Service Account:', SERVICE_ACCOUNT_EMAIL, 'Key:', keyPath);
      return driveClient;
    } catch (err) {
      console.error('❌ Failed to initialize Google Drive API:', err.message);
    }
  } else {
    console.warn('⚠️ Google Service Account key file not found in candidate paths');
  }
  return null;
}

// Inisialisasi awal saat server boot
getDriveClient();

// Format bytes ke ukuran yang mudah dibaca
function formatFileSize(bytes) {
  if (!bytes || bytes === '0') return 'Dokumen / Folder';
  const num = parseInt(bytes, 10);
  if (isNaN(num)) return bytes;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Mock data cadangan jika membuka folder bawaan seed ('mock-folder-xxx')
const MOCK_FILES = {
  'mock-folder-001': [
    { id: 'file-001', name: 'Naskah RPJMD 2025-2029.pdf', mimeType: 'application/pdf', size: '4.2 MB', modifiedTime: '2025-03-15', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-002', name: 'Matriks Target Kinerja.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '1.8 MB', modifiedTime: '2025-04-01', webViewLink: '#', webContentLink: '#', iconLink: 'xlsx' },
    { id: 'file-003', name: 'Peta Jalan Pembangunan.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: '8.5 MB', modifiedTime: '2025-04-10', webViewLink: '#', webContentLink: '#', iconLink: 'pptx' },
  ],
  'mock-folder-002': [
    { id: 'file-004', name: 'RKPD 2025 Final.pdf', mimeType: 'application/pdf', size: '3.1 MB', modifiedTime: '2025-01-20', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-005', name: 'Prioritas Program 2025.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '856 KB', modifiedTime: '2025-02-05', webViewLink: '#', webContentLink: '#', iconLink: 'docx' },
  ],
  'mock-folder-003': [
    { id: 'file-006', name: 'Renja Dinas PU 2025.pdf', mimeType: 'application/pdf', size: '2.3 MB', modifiedTime: '2025-02-28', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-007', name: 'Renja Dinas Kesehatan 2025.pdf', mimeType: 'application/pdf', size: '1.9 MB', modifiedTime: '2025-03-01', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-008', name: 'Rekap Renja Semua OPD.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '2.1 MB', modifiedTime: '2025-03-15', webViewLink: '#', webContentLink: '#', iconLink: 'xlsx' },
  ],
  'mock-folder-004': [
    { id: 'file-009', name: 'Laporan Evaluasi Q1 2025.pdf', mimeType: 'application/pdf', size: '5.6 MB', modifiedTime: '2025-04-15', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-010', name: 'Dashboard Kinerja Q1.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '3.2 MB', modifiedTime: '2025-04-20', webViewLink: '#', webContentLink: '#', iconLink: 'xlsx' },
  ],
  'mock-folder-005': [
    { id: 'file-011', name: 'Monev RPJMD 2024 - Tahunan.pdf', mimeType: 'application/pdf', size: '7.8 MB', modifiedTime: '2025-01-30', webViewLink: '#', webContentLink: '#', iconLink: 'pdf' },
    { id: 'file-012', name: 'Capaian Target RPJMD 2024.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '4.1 MB', modifiedTime: '2025-02-10', webViewLink: '#', webContentLink: '#', iconLink: 'xlsx' },
    { id: 'file-013', name: 'Presentasi Monev Bupati.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: '12.3 MB', modifiedTime: '2025-02-15', webViewLink: '#', webContentLink: '#', iconLink: 'pptx' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drive/service-account
// ─────────────────────────────────────────────────────────────────────────────
router.get('/service-account', (req, res) => {
  res.json({
    email: SERVICE_ACCOUNT_EMAIL,
    ready: !!getDriveClient(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drive/folders/:folderId/meta  — ambil nama folder untuk breadcrumb
// ─────────────────────────────────────────────────────────────────────────────
router.get('/folders/:folderId/meta', verifyToken, async (req, res) => {
  const { folderId } = req.params;
  if (folderId && folderId.startsWith('mock-')) {
    return res.json({ id: folderId, name: 'Folder Demo (' + folderId + ')', isMock: true });
  }
  const drive = getDriveClient();
  if (!drive) return res.status(500).json({ error: 'Google Drive API belum terhubung.' });
  try {
    const meta = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType', supportsAllDrives: true });
    return res.json({ id: meta.data.id, name: meta.data.name, mimeType: meta.data.mimeType });
  } catch (err) {
    return res.status(err.code || 500).json({ error: 'Gagal membaca metadata folder: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drive/folders/:folderId/access — cek apakah SA punya akses Editor
// Cara: coba buat folder sementara lalu hapus. Jika berhasil → editor.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/folders/:folderId/access', verifyToken, async (req, res) => {
  const { folderId } = req.params;

  // Mock folder: simulasikan editor access agar tombol tambah bisa dicoba
  if (folderId && folderId.startsWith('mock-')) {
    return res.json({ folderId, accessLevel: 'editor', isMock: true });
  }

  const drive = getDriveClient();
  if (!drive) {
    return res.json({ folderId, accessLevel: 'unknown', error: 'Drive API tidak siap.' });
  }

  // Coba buat folder sementara sebagai penanda akses editor
  let testId = null;
  try {
    const testFolder = await drive.files.create({
      requestBody: {
        name: '.tmp-access-check-' + Date.now(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });
    testId = testFolder.data.id;
    // Berhasil buat → hapus langsung
    await drive.files.delete({ fileId: testId, supportsAllDrives: true });
    return res.json({ folderId, accessLevel: 'editor' });
  } catch (err) {
    // Jika ada test folder yang tidak bisa dihapus, coba hapus
    if (testId) {
      try { await drive.files.delete({ fileId: testId, supportsAllDrives: true }); } catch (_) {}
    }
    const isPermission = err.code === 403 || err.code === 404 || err.message?.includes('Permission');
    return res.json({
      folderId,
      accessLevel: isPermission ? 'viewer' : 'unknown',
      hint: isPermission
        ? 'Folder ini di-share sebagai Viewer. Untuk bisa tambah/upload, ubah akses ke Editor di Google Drive.'
        : err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/drive/folders/:folderId  — list isi folder
// ─────────────────────────────────────────────────────────────────────────────
router.get('/folders/:folderId', verifyToken, async (req, res) => {
  const { folderId } = req.params;

  if (folderId && folderId.startsWith('mock-')) {
    // Kalau subfolder mock (format: mock-folder-xxx-sub1)
    if (folderId.includes('-sub')) {
      return res.json({
        files: [
          { id: folderId + '-f1', name: 'Dokumen Pendukung A.pdf', mimeType: 'application/pdf', isFolder: false, size: '1.2 MB', modifiedTime: '2025-05-01', webViewLink: '#', webContentLink: '#' },
          { id: folderId + '-f2', name: 'Lampiran B.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', isFolder: false, size: '450 KB', modifiedTime: '2025-05-03', webViewLink: '#', webContentLink: '#' },
        ],
        isMock: true,
        serviceAccount: SERVICE_ACCOUNT_EMAIL,
      });
    }
    const files = MOCK_FILES[folderId] || [];
    const mockWithFolders = [
      { id: folderId + '-sub1', name: 'Subfolder Dokumen Pendukung', mimeType: 'application/vnd.google-apps.folder', isFolder: true, size: null, modifiedTime: '2025-04-01', webViewLink: '#', webContentLink: '#' },
      ...files.map(f => ({ ...f, isFolder: false }))
    ];
    return res.json({ files: mockWithFolders, isMock: true, serviceAccount: SERVICE_ACCOUNT_EMAIL });
  }

  const drive = getDriveClient();
  if (!drive) {
    return res.status(500).json({ error: 'Google Drive API belum terhubung.', serviceAccount: SERVICE_ACCOUNT_EMAIL });
  }

  try {
    const response = await drive.files.list({
      q: "'" + folderId + "' in parents and trashed = false",
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink)',
      orderBy: 'folder, name',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = (response.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
      size: f.mimeType === 'application/vnd.google-apps.folder' ? null : formatFileSize(f.size),
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink || ('https://drive.google.com/drive/folders/' + f.id),
      webContentLink: f.webContentLink || f.webViewLink || ('https://drive.google.com/file/d/' + f.id + '/view'),
      iconLink: f.iconLink,
    }));

    return res.json({ files, isMock: false, serviceAccount: SERVICE_ACCOUNT_EMAIL, totalFiles: files.length });
  } catch (err) {
    console.error('❌ Google Drive API Error:', err.message);
    const isPermissionError = err.code === 404 || err.code === 403 || err.message?.includes('notFound') || err.message?.includes('Permission');
    return res.status(err.code || 500).json({
      error: isPermissionError
        ? 'Folder Google Drive tidak ditemukan atau belum dibagikan ke Service Account.\n\nPastikan folder dibagikan ke:\n' + SERVICE_ACCOUNT_EMAIL + '\n(Akses: Viewer atau Editor).'
        : 'Gagal membaca folder Google Drive: ' + err.message,
      serviceAccount: SERVICE_ACCOUNT_EMAIL,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drive/folders/:folderId/create-folder  — buat subfolder baru di Drive
// Body: { name: string }
// Auth: hanya admin bidang & super admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/folders/:folderId/create-folder', verifyToken, async (req, res) => {
  const { folderId } = req.params;
  const { name } = req.body;

  // RBAC: hanya admin_bidang & super_admin
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Admin Bidang dan Super Admin yang bisa membuat folder.' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama folder wajib diisi.' });
  }

  // Mock: simulasi berhasil
  if (folderId && folderId.startsWith('mock-')) {
    return res.json({
      success: true,
      folder: { id: 'mock-new-' + Date.now(), name: name.trim(), mimeType: 'application/vnd.google-apps.folder', isFolder: true },
      isMock: true,
      message: 'Demo: Folder berhasil dibuat (simulasi).',
    });
  }

  const drive = getDriveClient();
  if (!drive) return res.status(500).json({ error: 'Google Drive API belum terhubung.' });

  try {
    const created = await drive.files.create({
      requestBody: {
        name: name.trim(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId],
      },
      fields: 'id, name, mimeType, webViewLink, createdTime',
      supportsAllDrives: true,
    });

    return res.json({
      success: true,
      folder: {
        id: created.data.id,
        name: created.data.name,
        mimeType: created.data.mimeType,
        isFolder: true,
        modifiedTime: created.data.createdTime,
        webViewLink: created.data.webViewLink || ('https://drive.google.com/drive/folders/' + created.data.id),
        webContentLink: '#',
      },
    });
  } catch (err) {
    console.error('❌ Create folder error:', err.message);
    const isPermission = err.code === 403;
    return res.status(err.code || 500).json({
      error: isPermission
        ? 'Gagal membuat folder: Service Account tidak memiliki akses Editor ke folder ini. Ubah akses folder ke "Editor" di Google Drive.'
        : 'Gagal membuat folder: ' + err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drive/folders/:folderId/upload  — upload file ke Drive
// multipart/form-data: field "file"
// Auth: hanya admin_bidang & super_admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/folders/:folderId/upload', verifyToken, upload.single('file'), async (req, res) => {
  const { folderId } = req.params;

  // RBAC
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Admin Bidang dan Super Admin yang bisa mengupload file.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'File wajib disertakan.' });
  }

  // Mock: simulasi berhasil
  if (folderId && folderId.startsWith('mock-')) {
    return res.json({
      success: true,
      file: {
        id: 'mock-upload-' + Date.now(),
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        isFolder: false,
        size: formatFileSize(req.file.size.toString()),
        modifiedTime: new Date().toISOString(),
        webViewLink: '#',
        webContentLink: '#',
      },
      isMock: true,
      message: 'Demo: File berhasil diupload (simulasi).',
    });
  }

  const drive = getDriveClient();
  if (!drive) return res.status(500).json({ error: 'Google Drive API belum terhubung.' });

  try {
    // Konversi buffer ke Readable stream
    const stream = Readable.from(req.file.buffer);

    const uploaded = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: req.file.mimetype,
        body: stream,
      },
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
      supportsAllDrives: true,
    });

    return res.json({
      success: true,
      file: {
        id: uploaded.data.id,
        name: uploaded.data.name,
        mimeType: uploaded.data.mimeType,
        isFolder: false,
        size: formatFileSize(uploaded.data.size),
        modifiedTime: uploaded.data.createdTime,
        webViewLink: uploaded.data.webViewLink || ('https://drive.google.com/file/d/' + uploaded.data.id + '/view'),
        webContentLink: uploaded.data.webContentLink || ('https://drive.google.com/file/d/' + uploaded.data.id + '/view'),
      },
    });
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    const isPermission = err.code === 403;
    return res.status(err.code || 500).json({
      error: isPermission
        ? 'Gagal upload: Service Account tidak memiliki akses Editor ke folder ini. Ubah akses ke "Editor" di Google Drive.'
        : 'Gagal mengupload file: ' + err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/drive/validate  — validasi URL folder Drive
// ─────────────────────────────────────────────────────────────────────────────
router.post('/validate', verifyToken, async (req, res) => {
  const { drive_folder_url } = req.body;
  if (!drive_folder_url) return res.status(400).json({ error: 'URL folder wajib diisi.' });

  const match = drive_folder_url.match(/(?:folders\/|id=)([a-zA-Z0-9_-]+)/);
  const folderId = match ? match[1] : null;
  if (!folderId) {
    return res.status(400).json({ error: 'Format URL bukan link folder Google Drive yang valid.' });
  }

  if (folderId.startsWith('mock-')) {
    return res.json({ valid: true, folderId, folderName: 'Folder Demo Simulasi', isAccessible: true, isMock: true });
  }

  const drive = getDriveClient();
  if (!drive) {
    return res.json({ valid: true, folderId, isAccessible: false, message: 'ID folder valid, namun Google Drive API belum siap.' });
  }

  try {
    const meta = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType', supportsAllDrives: true });
    return res.json({ valid: true, folderId, folderName: meta.data.name, isAccessible: true, serviceAccount: SERVICE_ACCOUNT_EMAIL });
  } catch (err) {
    return res.json({
      valid: true, folderId, isAccessible: false,
      warning: 'Folder valid, tetapi Service Account belum diberi akses.\nBagikan folder ke: ' + SERVICE_ACCOUNT_EMAIL,
      serviceAccount: SERVICE_ACCOUNT_EMAIL,
    });
  }
});

module.exports = router;
