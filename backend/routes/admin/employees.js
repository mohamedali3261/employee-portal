const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { paginate, validateEmployeeId } = require('../../utils/helpers');
const { upload, logActivity } = require('./shared');

// GET /api/admin/employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM employees WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      const searchCondition = ' AND (name_ar LIKE ? OR name_en LIKE ? OR employee_id LIKE ?)';
      query += searchCondition;
      countQuery += searchCondition;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (department) {
      const deptCondition = ' AND department = ?';
      query += deptCondition;
      countQuery += deptCondition;
      params.push(department);
      countParams.push(department);
    }

    if (status) {
      const statusCondition = ' AND status = ?';
      query += statusCondition;
      countQuery += statusCondition;
      params.push(status);
      countParams.push(status);
    }

    const total = (await db.prepare(countQuery).get(...countParams)).total;
    const pagination = paginate(total, parseInt(page), parseInt(limit));

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pagination.limit, pagination.offset);

    const employees = await db.prepare(query).all(...params);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: pagination.pages
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

function processDocFiles(files, documentsStr) {
  let docs = [];
  try { docs = JSON.parse(documentsStr || '[]'); } catch { docs = []; }
  if (!Array.isArray(docs)) docs = [];
  if (!files || files.length === 0) return JSON.stringify(docs);
  const docFiles = files.filter(f => f.fieldname !== 'profile_image');
  docFiles.forEach((f, i) => {
    const idx = parseInt(f.fieldname.replace('doc_file_', ''));
    if (!isNaN(idx) && docs[idx]) {
      docs[idx].fileUrl = `/uploads/documents/${f.filename}`;
      delete docs[idx].file;
    }
  });
  return JSON.stringify(docs);
}

function parseCustomFields(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') {
    return fallback !== undefined ? fallback : '{}';
  }
  if (typeof raw === 'string') {
    try {
      return JSON.stringify(JSON.parse(raw) || {});
    } catch {
      return fallback !== undefined ? fallback : '{}';
    }
  }
  if (typeof raw === 'object') {
    return JSON.stringify(raw || {});
  }
  return fallback !== undefined ? fallback : '{}';
}

// POST /api/admin/employees
router.post('/', authenticateToken, upload.any(), async (req, res) => {
  try {
    const {
      employee_id, name_ar, name_en, job_title, job_title_ar, job_title_en, department,
      email, sector, hire_date, address,
      phone, phone2, status, notes,
      insurance_number, bank, bank_account, attendance_base, route, education, graduation_year,
      employment_start, languages, documents,
      custom_fields, birthdate
    } = req.body;

    if (!employee_id || !name_ar || !name_en) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Arabic name, and English name are required'
      });
    }

    if (!validateEmployeeId(employee_id)) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID must be digits only'
      });
    }

    const db = getDatabase();

    const existingEmployee = await db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(employee_id);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    const profileFile = (req.files || []).find(f => f.fieldname === 'profile_image');
    const profile_image = profileFile ? profileFile.filename : null;
    const processedDocs = processDocFiles(req.files, documents);
    const customFieldsStr = parseCustomFields(custom_fields, '{}');
    const defaultPassword = bcrypt.hashSync('123456', 12);

    const result = await db.prepare(`
      INSERT INTO employees (employee_id, name_ar, name_en, job_title, job_title_ar, job_title_en, department, email, sector, hire_date, address, phone, phone2, status, notes, profile_image, insurance_number, bank, bank_account, attendance_base, route, education, graduation_year, employment_start, languages, documents, custom_fields, password, must_change_password, birthdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employee_id, name_ar, name_en,
      job_title || '', job_title_ar || '', job_title_en || '',
      department || '',
      email || '', sector || '', hire_date || '', address || '',
      phone || '', phone2 || '', status || 'active', notes || '', profile_image,
      insurance_number || '', bank || '', bank_account || '',
      attendance_base || '', route || '', education || '', graduation_year || '',
      employment_start || '', languages || '[]', processedDocs, customFieldsStr, defaultPassword, 1,
      birthdate || null
    );

    logActivity('CREATE', 'employee', result.lastInsertRowid, `Created employee ${employee_id} - ${name_en}`);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/admin/employees/:id
router.put('/:id', authenticateToken, upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id, name_ar, name_en, job_title, job_title_ar, job_title_en, department,
      email, sector, hire_date, address,
      phone, phone2, status, notes,
      insurance_number, bank, bank_account, attendance_base, route, education, graduation_year,
      employment_start, languages, documents,
      custom_fields, birthdate
    } = req.body;

    const db = getDatabase();

    const existingEmployee = await db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee_id && employee_id !== existingEmployee.employee_id) {
      if (!validateEmployeeId(employee_id)) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID must be digits only'
        });
      }

      const duplicate = await db.prepare('SELECT id FROM employees WHERE employee_id = ? AND id != ?').get(employee_id, id);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    const profileFile = (req.files || []).find(f => f.fieldname === 'profile_image');
    const profile_image = profileFile ? profileFile.filename : existingEmployee.profile_image;

    // Merge document files into existing docs
    let existingDocs = [];
    try { existingDocs = JSON.parse(existingEmployee.documents || '[]'); } catch {}
    if (!Array.isArray(existingDocs)) existingDocs = [];
    let incomingDocs = [];
    try { incomingDocs = JSON.parse(documents || '[]'); } catch {}
    if (!Array.isArray(incomingDocs)) incomingDocs = [];

    // Carry over existing doc URLs for docs that don't have new files
    const docFiles = (req.files || []).filter(f => f.fieldname.startsWith('doc_file_'));
    docFiles.forEach(f => {
      const idx = parseInt(f.fieldname.replace('doc_file_', ''));
      if (!isNaN(idx) && incomingDocs[idx]) {
        incomingDocs[idx].fileUrl = `/uploads/documents/${f.filename}`;
        delete incomingDocs[idx].file;
      }
    });

    // Merge: use incoming docs; keep existing docs not in incoming
    const mergedDocs = incomingDocs.length > 0 ? incomingDocs : existingDocs;
    const documentsStr = JSON.stringify(mergedDocs);

    const customFieldsStr = parseCustomFields(custom_fields, existingEmployee.custom_fields || '{}');

    await db.prepare(`
      UPDATE employees SET
        employee_id = ?, name_ar = ?, name_en = ?, job_title = ?, job_title_ar = ?, job_title_en = ?, department = ?,
        email = ?, sector = ?, hire_date = ?, address = ?,
        phone = ?, phone2 = ?,
        status = ?, notes = ?, profile_image = ?,
        insurance_number = ?, bank = ?, bank_account = ?,
        attendance_base = ?, route = ?, education = ?, graduation_year = ?,
        employment_start = ?, languages = ?, documents = ?, custom_fields = ?,
        updated_at = CURRENT_TIMESTAMP, birthdate = ?
      WHERE id = ?
    `).run(
      employee_id || existingEmployee.employee_id,
      name_ar || existingEmployee.name_ar,
      name_en || existingEmployee.name_en,
      job_title || existingEmployee.job_title,
      job_title_ar || existingEmployee.job_title_ar || '',
      job_title_en || existingEmployee.job_title_en || '',
      department || existingEmployee.department,
      email || existingEmployee.email || '',
      sector || existingEmployee.sector || '',
      hire_date || existingEmployee.hire_date || '',
      address || existingEmployee.address || '',
      phone || existingEmployee.phone,
      phone2 || existingEmployee.phone2 || '',
      status || existingEmployee.status,
      notes || existingEmployee.notes,
      profile_image,
      insurance_number || existingEmployee.insurance_number,
      bank || existingEmployee.bank,
      bank_account || existingEmployee.bank_account,
      attendance_base || existingEmployee.attendance_base,
      route || existingEmployee.route,
      education || existingEmployee.education,
      graduation_year || existingEmployee.graduation_year,
      employment_start || existingEmployee.employment_start || '',
      languages || existingEmployee.languages || '[]',
      documentsStr || existingEmployee.documents || '[]',
      customFieldsStr,
      birthdate !== undefined ? birthdate : existingEmployee.birthdate,
      id
    );

    logActivity('UPDATE', 'employee', id, `Updated employee ${employee_id || existingEmployee.employee_id}`);

    res.json({
      success: true,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/employees/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const employee = await db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await db.prepare('DELETE FROM employees WHERE id = ?').run(id);

    logActivity('DELETE', 'employee', id, `Deleted employee ${employee.employee_id} - ${employee.name_en}`);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/import
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { employees } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: 'Employees array is required'
      });
    }

    const db = getDatabase();
    let imported = 0;
    let skipped = 0;
    const errors = [];

    const defaultImportHash = bcrypt.hashSync('123456', 12);

    for (const emp of employees) {
      try {
        if (!emp.employee_id || !emp.name_ar || !emp.name_en) {
          skipped++;
          errors.push(`Skipped: Missing required fields for ${emp.employee_id || 'unknown'}`);
          continue;
        }

        if (!validateEmployeeId(emp.employee_id)) {
          skipped++;
          errors.push(`Skipped: Invalid employee_id format for ${emp.employee_id}`);
          continue;
        }

        const existing = await db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(emp.employee_id);
        if (existing) {
          await db.prepare(`UPDATE employees SET
            name_ar=?, name_en=?, job_title=?, department=?, email=?, sector=?, hire_date=?, address=?, phone=?,
            status=?, notes=?,
            insurance_number=?, bank=?, bank_account=?,
            attendance_base=?, route=?, education=?, graduation_year=?,
            job_title_ar=?, job_title_en=?, employment_start=?, custom_fields=?, birthdate=?, languages=?
            WHERE employee_id=?`).run(
            emp.name_ar, emp.name_en, emp.job_title || '',
            emp.department || '', emp.email || '', emp.sector || '', emp.hire_date || '', emp.address || '', emp.phone || '',
            emp.status || 'active',
            emp.notes || '',
            emp.insurance_number || '', emp.bank || '', emp.bank_account || '',
            emp.attendance_base || '', emp.route || '', emp.education || '', emp.graduation_year || '',
            emp.job_title_ar || '', emp.job_title_en || '', emp.employment_start || '',
            parseCustomFields(emp.custom_fields, '{}'),
            emp.birthdate || null,
            JSON.stringify(emp.languages || []),
            emp.employee_id
          );
          imported++;
        } else {
          await db.prepare(`INSERT INTO employees
            (employee_id, name_ar, name_en, job_title, department, email, sector, hire_date, address, phone,
            status, notes,
            insurance_number, bank, bank_account,
            attendance_base, route, education, graduation_year,
            job_title_ar, job_title_en, employment_start,
            custom_fields,
            password, must_change_password, birthdate, languages)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
            emp.employee_id, emp.name_ar, emp.name_en, emp.job_title || '',
            emp.department || '', emp.email || '', emp.sector || '', emp.hire_date || '', emp.address || '', emp.phone || '',
            emp.status || 'active',
            emp.notes || '',
            emp.insurance_number || '', emp.bank || '', emp.bank_account || '',
            emp.attendance_base || '', emp.route || '', emp.education || '', emp.graduation_year || '',
            emp.job_title_ar || '', emp.job_title_en || '', emp.employment_start || '',
            parseCustomFields(emp.custom_fields, '{}'),
            defaultImportHash, 1,
            emp.birthdate || null,
            JSON.stringify(emp.languages || [])
          );
          imported++;
        }
      } catch (err) {
        skipped++;
        errors.push(`Error for ${emp.employee_id}: ${err.message}`);
      }
    }

    logActivity('IMPORT', 'employee', null, `Imported ${imported} employees, skipped ${skipped}`);

    res.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      data: {
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Import employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
