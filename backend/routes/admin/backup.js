const express = require('express');
const router = express.Router();
const { getDatabase, initDatabase } = require('../../database/init');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');
const { logActivity } = require('./shared');

// Export full DB dump (all tables) as JSON
router.post('/export-db', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const tables = ['employees', 'admin_users', 'sections', 'custom_fields', 'profile_sections', 'section_fields', 'activity_log'];
    const dump = {};
    for (const table of tables) {
      dump[table] = await db.prepare(`SELECT * FROM ${table}`).all();
    }
    const filename = `employee-portal-backup-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ message: 'Failed to export database' });
  }
});

// Export JSON data
router.post('/export-json', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    const rows = await db.prepare('SELECT * FROM employees').all();
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
    if (!Array.isArray(backup) || backup.length === 0) return res.status(400).json({ message: 'Invalid backup format' });
    const db = getDatabase();
    const columns = Object.keys(backup[0]).filter((col) => col !== 'id' && col !== 'created_at' && col !== 'updated_at');
    const placeholders = columns.map(() => '?').join(',');
    const updates = columns.filter((col) => col !== 'employee_id').map((col) => `${col} = EXCLUDED.${col}`).join(', ');
    const insert = db.prepare(`INSERT INTO employees (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT (employee_id) DO UPDATE SET ${updates}`);

    await db.transaction(async () => {
      for (const rec of backup) {
        await insert.run(...columns.map((col) => (rec[col] === undefined ? null : rec[col])));
      }
    });

    logActivity('IMPORT_JSON', 'employee', null, `Imported ${backup.length} employee records`);
    res.json({ message: 'Import successful', importedCount: backup.length });
  } catch (err) {
    console.error('JSON import error:', err);
    res.status(500).json({ message: 'Failed to import JSON backup' });
  }
});

// Reset DB to default template
router.post('/reset-db', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    await db.transaction(async () => {
      await db.prepare('TRUNCATE TABLE activity_log, employees, section_fields, custom_fields, profile_sections, sections RESTART IDENTITY CASCADE').run();
    });
    await initDatabase();

    logActivity('RESET_DB', 'database', null, 'Database reset to default state');
    res.json({ message: 'Database has been reset to the default state' });
  } catch (err) {
    console.error('Database reset error:', err);
    res.status(500).json({ message: 'Failed to reset database' });
  }
});

module.exports = router;
