const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');

// GET /api/activity-logs - super admin only
router.get('/', verifyToken, requireSuperAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM activity_logs
    ORDER BY timestamp DESC
    LIMIT 200
  `).all();
  res.json({ logs });
});

module.exports = router;
