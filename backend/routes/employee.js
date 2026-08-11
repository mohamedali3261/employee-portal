const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase, saveDatabase } = require('../database/init');
const { validateEmployeeId } = require('../utils/helpers');

const DEFAULT_PASSWORD = '123456';

// POST /api/employee/login
router.post('/login', (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!validateEmployeeId(employee_id)) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID must be digits only'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const db = getDatabase();
    const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check password - if no password set, use default
    const storedHash = employee.password;
    let passwordValid = false;

    if (!storedHash) {
      // No password set yet - check against default plaintext
      passwordValid = password === DEFAULT_PASSWORD;
    } else {
      passwordValid = bcrypt.compareSync(password, storedHash);
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    const mustChangePassword = employee.must_change_password === 1;

    res.json({
      success: true,
      data: employee,
      mustChangePassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/employee/change-password
router.post('/change-password', (req, res) => {
  try {
    const { employee_id, newPassword } = req.body;

    if (!employee_id || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const db = getDatabase();
    const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE employees SET password = ?, must_change_password = 0 WHERE employee_id = ?').run(hashedPassword, employee_id);
    saveDatabase();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/employee/search?q=query
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, data: [] });
    }
    const db = getDatabase();
    const searchTerm = `%${q.trim()}%`;
    const employees = db.prepare(
      'SELECT * FROM employees WHERE employee_id LIKE ? OR name_ar LIKE ? OR name_en LIKE ? LIMIT 10'
    ).all(searchTerm, searchTerm, searchTerm);

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Search employees error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/employee/custom-fields
router.get('/custom-fields', (req, res) => {
  try {
    const db = getDatabase();
    const fields = db.prepare('SELECT * FROM custom_fields ORDER BY id ASC').all();
    res.json({ success: true, data: fields });
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/employee/profile-sections
router.get('/profile-sections', (req, res) => {
  try {
    const db = getDatabase();
    const sections = db.prepare('SELECT * FROM profile_sections ORDER BY sort_order ASC, id ASC').all();
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get profile sections error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/employee/section-fields
router.get('/section-fields', (req, res) => {
  try {
    const db = getDatabase();
    const fields = db.prepare('SELECT * FROM section_fields WHERE is_visible = 1 ORDER BY section_id ASC, sort_order ASC, id ASC').all();
    res.json({ success: true, data: fields });
  } catch (error) {
    console.error('Get section fields error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/employee/:id
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const query = decodeURIComponent(id).trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Employee search query is required'
      });
    }

    const db = getDatabase();
    // 1. Try exact employee_id match
    let employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(query);

    // 2. If not found, try searching by name or partial employee_id
    if (!employee) {
      employee = db.prepare(
        'SELECT * FROM employees WHERE name_ar LIKE ? OR name_en LIKE ? OR employee_id LIKE ? LIMIT 1'
      ).get(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;