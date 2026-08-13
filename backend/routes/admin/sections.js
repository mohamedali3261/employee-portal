const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { logActivity } = require('./shared');

// GET /api/admin/sections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const sections = await db.prepare('SELECT * FROM sections ORDER BY name_en ASC').all();

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/sections
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name_en, name_ar } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English name and Arabic name are required'
      });
    }

    const db = getDatabase();

    const existing = await db.prepare('SELECT id FROM sections WHERE name_en = ?').get(name_en);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Section already exists'
      });
    }

    const result = await db.prepare('INSERT INTO sections (name_en, name_ar) VALUES (?, ?)').run(name_en, name_ar);

    logActivity('CREATE', 'section', result.lastInsertRowid, `Created section ${name_en} - ${name_ar}`);

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: { id: result.lastInsertRowid, name_en, name_ar }
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/sections/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const section = await db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const employeesUsing = await db.prepare('SELECT COUNT(*) as count FROM employees WHERE department = ?').get(section.name_en);
    if (employeesUsing.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete section: ${employeesUsing.count} employee(s) are assigned to it`
      });
    }

    await db.prepare('DELETE FROM sections WHERE id = ?').run(id);

    logActivity('DELETE', 'section', id, `Deleted section ${section.name_en} - ${section.name_ar}`);

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
