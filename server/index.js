require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bidang', require('./routes/bidang'));
app.use('/api/users', require('./routes/users'));
app.use('/api/drive-links', require('./routes/driveLinks'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/tahapan', require('./routes/tahapan'));
app.use('/api/admin/keepalive', require('./routes/keepAlive'));

// Health check & Ping
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pusat Data Bapperida API running', timestamp: new Date().toISOString() });
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

const keepAliveService = require('./services/keepAlive');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Pusat Data Bapperida API Server`);
  console.log(`   Running at: http://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
  
  // Inisialisasi Auto-Reset / Keep-Alive Service
  keepAliveService.init();
});

module.exports = app;
