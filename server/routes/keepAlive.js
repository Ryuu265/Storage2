const express = require('express');
const router = express.Router();
const { verifyToken, requireAdminOrAbove } = require('../middleware/auth');
const keepAliveService = require('../services/keepAlive');

// Semua route di bawah ini membutuhkan autentikasi Admin
router.use(verifyToken, requireAdminOrAbove);

// GET /api/admin/keepalive/status
router.get('/status', (req, res) => {
  try {
    const status = keepAliveService.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil status keep-alive: ' + err.message });
  }
});

// POST /api/admin/keepalive/toggle
router.post('/toggle', (req, res) => {
  try {
    const { active } = req.body;
    if (active === undefined) {
      return res.status(400).json({ error: 'Parameter active (true/false) diperlukan.' });
    }
    const updated = keepAliveService.updateConfig({ active: !!active });
    res.json({ success: true, message: `Auto-reset berhasil di-${active ? 'aktifkan' : 'nonaktifkan'}.`, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah status keep-alive: ' + err.message });
  }
});

// POST /api/admin/keepalive/config
router.post('/config', (req, res) => {
  try {
    const { active, interval_minutes, schedule_enabled, work_start, work_end } = req.body;
    const updated = keepAliveService.updateConfig({
      active,
      interval_minutes,
      schedule_enabled,
      work_start,
      work_end,
    });
    res.json({ success: true, message: 'Konfigurasi keep-alive berhasil disimpan.', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan konfigurasi: ' + err.message });
  }
});

// POST /api/admin/keepalive/ping
router.post('/ping', async (req, res) => {
  try {
    const result = await keepAliveService.performPing(true);
    const updated = keepAliveService.getStatus();
    res.json({ success: result.success, message: result.success ? 'Ping berhasil dikirim.' : 'Ping gagal.', pingResult: result, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menjalankan ping: ' + err.message });
  }
});

module.exports = router;
