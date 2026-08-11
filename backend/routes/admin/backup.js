const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
// Updated import to use getDatabase from init.js
const { getDatabase } = require('../../database/init');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');

function getDatabasePath() {
  return path.resolve(__dirname, '../../data/database.sqlite');
}

// Export DB file
router.post('/export-db', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) return res.status(404).json({ message: 'Database file not found' });
    res.download(dbPath, 'employee-portal-backup.sqlite');
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ message: 'Failed to export database' });
  }
});

// Export JSON data
router.post('/export-json', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM employees').all();
    const json = JSON.stringify(rows, null, 2);
    const filename = `employees-backup-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(json);
  } catch (err) {
    console.error('JSON export error:', err);
    res.status(500).json({ message: 'Failed to export JSON' });
  }
});

// Import JSON backup
router.post('/import-json', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const backup = req.body;
    if (!Array.isArray(backup)) return res.status(400).json({ message: 'Invalid backup format' });
    const db = getDatabase();
    const columns = Object.keys(backup[0]);
    const placeholders = columns.map(() => '?').join(',');
    const insert = db.prepare(`INSERT OR REPLACE INTO employees (${columns.join(',')}) VALUES (${placeholders})`);
    const transaction = db.transaction((records) => { records.forEach(rec => insert.run(Object.values(rec))); });
    transaction(backup);
    const logStmt = db.prepare('INSERT INTO activity_log (action, description, timestamp) VALUES (?, ?, ?)');
    logStmt.run('IMPORT_JSON', `Imported ${backup.length} employee records`, Date.now());
    res.json({ message: 'Import successful', importedCount: backup.length });
  } catch (err) {
    console.error('JSON import error:', err);
    res.status(500).json({ message: 'Failed to import JSON backup' });
  }
});

// Reset DB to default template
router.post('/reset-db', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const defaultDbPath = path.resolve(__dirname, '../../data/default.sqlite');
    const targetPath = getDatabasePath();
    if (!fs.existsSync(defaultDbPath)) return res.status(404).json({ message: 'Default database template not found' });
    fs.copyFileSync(defaultDbPath, targetPath);
    const db = getDatabase();
    const logStmt = db.prepare('INSERT INTO activity_log (action, description, timestamp) VALUES (?, ?, ?)');
    logStmt.run('RESET_DB', 'Database reset to default template', Date.now());
    res.json({ message: 'Database has been reset to the default state' });
  } catch (err) {
    console.error('Database reset error:', err);
    res.status(500).json({ message: 'Failed to reset database' });
  }
});

module.exports = router;
