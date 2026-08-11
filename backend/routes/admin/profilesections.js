const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { logActivity } = require('./shared');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'section';
}

function generateUniqueKey(db, base) {
  let key = slugify(base);
  let candidate = key;
  let counter = 2;
  while (db.prepare('SELECT id FROM profile_sections WHERE section_key = ?').get(candidate)) {
    candidate = `${key}_${counter}`;
    counter++;
  }
  return candidate;
}

// GET /api/admin/profile-sections
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const sections = db.prepare('SELECT * FROM profile_sections ORDER BY sort_order ASC, id ASC').all();
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get profile sections error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/profile-sections
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name_en, name_ar, column_no = 2 } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English name and Arabic name are required'
      });
    }

    const db = getDatabase();
    const section_key = generateUniqueKey(db, name_en);
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM profile_sections').get();
    const sort_order = (maxOrder?.max_order || 0) + 10;

    const result = db.prepare(
      'INSERT INTO profile_sections (section_key, name_en, name_ar, sort_order, column_no, is_builtin) VALUES (?, ?, ?, ?, ?, 0)'
    ).run(section_key, name_en, name_ar, sort_order, column_no === 1 ? 1 : 2);

    logActivity('CREATE', 'profile_section', result.lastInsertRowid, `Created profile section ${name_en} - ${name_ar}`);

    res.status(201).json({
      success: true,
      message: 'Profile section created successfully',
      data: {
        id: result.lastInsertRowid,
        section_key,
        name_en,
        name_ar,
        sort_order,
        column_no: column_no === 1 ? 1 : 2,
        is_builtin: 0,
      }
    });
  } catch (error) {
    console.error('Create profile section error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/profile-sections/:id
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, sort_order, column_no } = req.body;

    const db = getDatabase();
    const section = db.prepare('SELECT * FROM profile_sections WHERE id = ?').get(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Profile section not found' });
    }

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English name and Arabic name are required'
      });
    }

    const nextOrder = Number(sort_order);
    const finalOrder = Number.isFinite(nextOrder) && nextOrder > 0 ? nextOrder : section.sort_order;
    const finalColumn = column_no === 1 || column_no === 2 ? column_no : section.column_no;

    db.prepare('UPDATE profile_sections SET name_en = ?, name_ar = ?, sort_order = ?, column_no = ? WHERE id = ?')
      .run(name_en, name_ar, finalOrder, finalColumn, id);

    logActivity('UPDATE', 'profile_section', id, `Updated profile section ${name_en} - ${name_ar}`);

    res.json({
      success: true,
      message: 'Profile section updated successfully',
      data: { id, section_key: section.section_key, name_en, name_ar, sort_order: finalOrder, column_no: finalColumn, is_builtin: section.is_builtin }
    });
  } catch (error) {
    console.error('Update profile section error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/profile-sections/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const section = db.prepare('SELECT * FROM profile_sections WHERE id = ?').get(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Profile section not found' });
    }

    if (Number(section.is_builtin) === 1) {
      return res.status(400).json({ success: false, message: 'Built-in sections cannot be deleted' });
    }

    // Reassign custom fields that belong to this section back to the default custom fields section
    db.prepare('UPDATE custom_fields SET section_id = NULL WHERE section_id = ?').run(id);
    db.prepare('DELETE FROM profile_sections WHERE id = ?').run(id);

    logActivity('DELETE', 'profile_section', id, `Deleted profile section ${section.name_en} - ${section.name_ar}`);

    res.json({
      success: true,
      message: 'Profile section deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile section error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
