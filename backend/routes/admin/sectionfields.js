const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { logActivity } = require('./shared');

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown', 'status'];

// Catalog of ready-made built-in fields that can be added to sections.
// field_key matches the employee camelCase key used by the frontend.
const BUILTIN_FIELD_CATALOG = [
  { field_key: 'employeeId', name_en: 'Employee ID', name_ar: 'رقم الموظف', type: 'text' },
  { field_key: 'arabicName', name_en: 'Arabic Name', name_ar: 'الاسم بالعربية', type: 'text' },
  { field_key: 'englishName', name_en: 'English Name', name_ar: 'الاسم بالإنجليزية', type: 'text' },
  { field_key: 'jobTitle', name_en: 'Job Title', name_ar: 'المسمى الوظيفي', type: 'text' },
  { field_key: 'jobTitleAr', name_en: 'Job Title (Arabic)', name_ar: 'المسمى الوظيفي (عربي)', type: 'text' },
  { field_key: 'jobTitleEn', name_en: 'Job Title (English)', name_ar: 'المسمى الوظيفي (إنجليزي)', type: 'text' },
  { field_key: 'department', name_en: 'Department', name_ar: 'القسم', type: 'dropdown' },
  { field_key: 'phone', name_en: 'Phone', name_ar: 'رقم الهاتف', type: 'text' },
  { field_key: 'email', name_en: 'Email', name_ar: 'البريد الإلكتروني', type: 'text' },
  { field_key: 'address', name_en: 'Address', name_ar: 'العنوان', type: 'text' },
  { field_key: 'age', name_en: 'Age', name_ar: 'العمر', type: 'number' },
  { field_key: 'status', name_en: 'Employment Status', name_ar: 'حالة التوظيف', type: 'status' },
  { field_key: 'education', name_en: 'Education', name_ar: 'المؤهل العلمي', type: 'text' },
  { field_key: 'graduationYear', name_en: 'Graduation Year', name_ar: 'سنة التخرج', type: 'text' },
  { field_key: 'employmentStart', name_en: 'Employment Start Date', name_ar: 'تاريخ بداية العمل', type: 'date' },
  { field_key: 'hireDate', name_en: 'Hire Date', name_ar: 'تاريخ التعيين', type: 'date' },
  { field_key: 'sector', name_en: 'Sector', name_ar: 'القطاع', type: 'text' },
  { field_key: 'insuranceNumber', name_en: 'Insurance Number', name_ar: 'رقم التأمين', type: 'text' },
  { field_key: 'bank', name_en: 'Bank', name_ar: 'البنك', type: 'text' },
  { field_key: 'bankAccount', name_en: 'Bank Account', name_ar: 'رقم الحساب البنكي', type: 'text' },
  { field_key: 'attendanceBase', name_en: 'Attendance Base', name_ar: 'أساس الحضور', type: 'text' },
  { field_key: 'route', name_en: 'Route', name_ar: 'الخط', type: 'text' },
  { field_key: 'notes', name_en: 'Notes', name_ar: 'ملاحظات', type: 'textarea' },
];

// GET /api/admin/section-fields
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const fields = await db.prepare('SELECT * FROM section_fields ORDER BY section_id ASC, sort_order ASC, id ASC').all();
    res.json({ success: true, data: fields });
  } catch (error) {
    console.error('Get section fields error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/section-fields/builtins
router.get('/builtins', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const existing = await db.prepare('SELECT field_key FROM section_fields').all();
    const usedKeys = new Set(existing.map((f) => f.field_key));
    const data = BUILTIN_FIELD_CATALOG.map((f) => ({ ...f, is_used: usedKeys.has(f.field_key) }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get builtin fields error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

async function validateSectionId(db, sectionId) {
  if (Number.isFinite(Number(sectionId)) && Number(sectionId) > 0) {
    const section = await db.prepare('SELECT id FROM profile_sections WHERE id = ?').get(Number(sectionId));
    return section ? Number(sectionId) : null;
  }
  return null;
}

// POST /api/admin/section-fields  (add a ready built-in field to a section)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { field_key, section_id, sort_order } = req.body;

    if (!field_key) {
      return res.status(400).json({ success: false, message: 'field_key is required' });
    }

    const catalogItem = BUILTIN_FIELD_CATALOG.find((f) => f.field_key === field_key);
    if (!catalogItem) {
      return res.status(400).json({ success: false, message: 'Unknown built-in field' });
    }

    const db = getDatabase();
    const existing = await db.prepare('SELECT id FROM section_fields WHERE field_key = ?').get(field_key);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This field is already added' });
    }

    const finalSectionId = await validateSectionId(db, section_id);
    if (!finalSectionId) {
      return res.status(400).json({ success: false, message: 'A valid section is required' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as max_order FROM section_fields WHERE section_id = ?').get(finalSectionId);
    const finalOrder = Number.isFinite(Number(sort_order)) && Number(sort_order) > 0 ? Number(sort_order) : (maxOrder?.max_order || 0) + 10;

    const result = await db.prepare(
      'INSERT INTO section_fields (field_key, name_en, name_ar, type, section_id, is_builtin, is_visible, required, sort_order) VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?)'
    ).run(catalogItem.field_key, catalogItem.name_en, catalogItem.name_ar, catalogItem.type, finalSectionId, finalOrder);

    logActivity('CREATE', 'section_field', result.lastInsertRowid, `Added built-in field ${catalogItem.name_en} to section`);

    res.status(201).json({
      success: true,
      message: 'Field added successfully',
      data: { id: result.lastInsertRowid, ...catalogItem, section_id: finalSectionId, is_builtin: 1, is_visible: 1, required: 0, sort_order: finalOrder }
    });
  } catch (error) {
    console.error('Add section field error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/section-fields/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_ar, section_id, sort_order, is_visible, type, options } = req.body;

    const db = getDatabase();
    const field = await db.prepare('SELECT * FROM section_fields WHERE id = ?').get(id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    if (!name_en || !name_ar) {
      return res.status(400).json({ success: false, message: 'English name and Arabic name are required' });
    }

    const finalSectionId = await validateSectionId(db, section_id);
    const finalType = FIELD_TYPES.includes(type) ? type : field.type || 'text';
    const finalOrder = Number.isFinite(Number(sort_order)) && Number(sort_order) > 0 ? Number(sort_order) : field.sort_order;
    const finalVisible = is_visible === undefined ? field.is_visible : (is_visible ? 1 : 0);
    const optionsStr = finalType === 'dropdown' ? String(options || '').split(',').map(s => s.trim()).filter(Boolean).join(',') : null;

    await db.prepare('UPDATE section_fields SET name_en = ?, name_ar = ?, type = ?, options = ?, section_id = ?, sort_order = ?, is_visible = ? WHERE id = ?')
      .run(name_en, name_ar, finalType, optionsStr, finalSectionId, finalOrder, finalVisible, id);

    logActivity('UPDATE', 'section_field', id, `Updated field ${name_en} - ${name_ar}`);

    res.json({
      success: true,
      message: 'Field updated successfully',
      data: { id, field_key: field.field_key, name_en, name_ar, type: finalType, options: optionsStr, section_id: finalSectionId, sort_order: finalOrder, is_visible: finalVisible, is_builtin: field.is_builtin }
    });
  } catch (error) {
    console.error('Update section field error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/section-fields/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const field = await db.prepare('SELECT * FROM section_fields WHERE id = ?').get(id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    await db.prepare('DELETE FROM section_fields WHERE id = ?').run(id);

    logActivity('DELETE', 'section_field', id, `Deleted field ${field.name_en} - ${field.name_ar}`);

    res.json({ success: true, message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Delete section field error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
