const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { logActivity } = require('./shared');

const DEFAULT_USER_PASSWORD = '123456';

// GET /api/admin/users - Get list of admin users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const users = await db.prepare(`
      SELECT id, username, role, must_change_password, created_at 
      FROM admin_users 
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/users - Create new admin user by username only (default password: 123456)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, role } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 50 characters'
      });
    }

    const db = getDatabase();

    const existing = await db.prepare('SELECT id FROM admin_users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const hashedPassword = bcrypt.hashSync(DEFAULT_USER_PASSWORD, 12);
    const userRole = role || 'admin';

    const result = await db.prepare(`
      INSERT INTO admin_users (username, password, role, must_change_password)
      VALUES (?, ?, ?, 1)
    `).run(cleanUsername, hashedPassword, userRole);

    logActivity('CREATE', 'user', result.lastInsertRowid, `Created admin user: ${cleanUsername}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        role: userRole,
        must_change_password: 1
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/admin/users/:id - Edit admin username
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 50 characters'
      });
    }

    const db = getDatabase();

    const existingUser = await db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const duplicate = await db.prepare('SELECT id FROM admin_users WHERE username = ? AND id != ?').get(cleanUsername, id);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    await db.prepare('UPDATE admin_users SET username = ? WHERE id = ?').run(cleanUsername, id);

    logActivity('UPDATE', 'user', id, `Updated username from '${existingUser.username}' to '${cleanUsername}'`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: parseInt(id),
        username: cleanUsername
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/users/:id/reset-password - Reset password to default (123456)
router.post('/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const user = await db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = bcrypt.hashSync(DEFAULT_USER_PASSWORD, 12);
    await db.prepare('UPDATE admin_users SET password = ?, must_change_password = 1 WHERE id = ?').run(hashedPassword, id);

    logActivity('RESET_PASSWORD', 'user', id, `Reset password for user '${user.username}' to default 123456`);

    res.json({
      success: true,
      message: 'Password reset to default (123456) successfully'
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/users/:id - Delete admin user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own current account'
      });
    }

    const user = await db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);

    logActivity('DELETE', 'user', id, `Deleted user '${user.username}'`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
