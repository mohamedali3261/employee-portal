const express = require('express');
const router = express.Router();
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { paginate } = require('../../utils/helpers');

// GET /api/admin/dashboard/statistics
router.get('/statistics', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const activeEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'active'").get().count;
    const inactiveEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'inactive'").get().count;

    const departmentsCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;

    const employeesByDepartment = db.prepare(`
      SELECT department, COUNT(*) as count 
      FROM employees 
      WHERE department IS NOT NULL 
      GROUP BY department 
      ORDER BY count DESC
    `).all();

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        departmentsCount,
        employeesByDepartment,
        statusDistribution: [
          { status: 'active', count: activeEmployees },
          { status: 'inactive', count: inactiveEmployees }
        ]
      }
    });
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/activity-log
router.get('/activity-log', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM activity_log').get().count;
    const pagination = paginate(total, parseInt(page), parseInt(limit));

    const logs = db.prepare(`
      SELECT * FROM activity_log 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(pagination.limit, pagination.offset);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: pagination.pages
      }
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
