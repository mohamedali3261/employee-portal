const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { logActivity } = require('./shared');

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown'];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'field';
}

function generateUniqueKey(db, base) {
  let key = slugify(base);
  let candidate = key;
  let counter = 2;
  while (db.prepare('SELECT id FROM custom_fields WHERE field_key = ?').get(candidate)) {
    candidate = `${key}_${counter}`;
    counter++;
  }
  return candidate;
}

// GET /api/admin/custom-fields
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const fields = db.prepare('SELECT * FROM custom_fields ORDER BY id ASC').all();
    res.json({ success: true, data: fields });
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/custom-fields
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name_en, name_ar, type = 'text', options, section_id = null } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English name and Arabic name are required'
      });
    }

    const fieldType = FIELD_TYPES.includes(type) ? type : 'text';
    const optionsStr = fieldType === 'dropdown'
      ? String(options || '').split(',').map(s => s.trim()).filter(Boolean).join(',')
      : null;

    const db = getDatabase();
    const field_key = generateUniqueKey(db, name_en);
    const finalSectionId = Number.isFinite(Number(section_id)) && Number(section_id) > 0 ? Number(section_id) : null;

    const result = db.prepare(
      'INSERT INTO custom_fields (name_en, name_ar, field_key, type, options, section_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name_en, name_ar, field_key, fieldType, optionsStr, finalSectionId);

    logActivity('CREATE', 'custom_field', result.lastInsertRowid, `Created custom field ${name_en} - ${name_ar} (${field_key})`);

    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      data: {
        id: result.lastInsertRowid,
        name_en,
        name_ar,
        field_key,
        type: fieldType,
        options: optionsStr,
        section_id: finalSectionId,
      }
    });
  } catch (error) {
    console.error('Create custom field error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/custom-fields/:id
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, type = 'text', options, section_id = null } = req.body;

    const db = getDatabase();
    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Custom field not found' });
    }

    if (!name_en || !name_ar) {
      return res.status(400).json({
        success: false,
        message: 'English name and Arabic name are required'
      });
    }

    const fieldType = FIELD_TYPES.includes(type) ? type : field.type || 'text';
    const optionsStr = fieldType === 'dropdown'
      ? String(options || '').split(',').map(s => s.trim()).filter(Boolean).join(',')
      : null;
    const finalSectionId = Number.isFinite(Number(section_id)) && Number(section_id) > 0 ? Number(section_id) : null;

    // field_key is immutable: renaming a field must not orphan saved employee values
    const field_key = field.field_key;

    db.prepare('UPDATE custom_fields SET name_en = ?, name_ar = ?, field_key = ?, type = ?, options = ?, section_id = ? WHERE id = ?')
      .run(name_en, name_ar, field_key, fieldType, optionsStr, finalSectionId, id);

    logActivity('UPDATE', 'custom_field', id, `Updated custom field ${name_en} - ${name_ar}`);

    res.json({
      success: true,
      message: 'Custom field updated successfully',
      data: { id, name_en, name_ar, field_key, type: fieldType, options: optionsStr, section_id: finalSectionId }
    });
  } catch (error) {
    console.error('Update custom field error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/custom-fields/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found'
      });
    }

    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id);

    logActivity('DELETE', 'custom_field', id, `Deleted custom field ${field.name_en} - ${field.name_ar}`);

    res.json({
      success: true,
      message: 'Custom field deleted successfully'
    });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
