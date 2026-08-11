const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');
const { loginLimiter, settingsLimiter, logActivity } = require('./shared');

// POST /api/admin/login
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.length > 50 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input'
      });
    }

    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!admin) {
      console.warn(`⚠ Failed login attempt: user '${username}' from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const validPassword = bcrypt.compareSync(password, admin.password);
    if (!validPassword) {
      console.warn(`⚠ Failed login attempt: user '${admin.username}' (id:${admin.id}) from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`✓ Successful login: user '${admin.username}' (role:${admin.role}) from ${req.ip}`);

    const mustChangePassword = admin.must_change_password === 1;

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, mustChangePassword },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: rememberMe ? '30d' : '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        mustChangePassword,
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const admin = db.prepare('SELECT id, username, role, created_at FROM admin_users WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, data: admin });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/settings/credentials
router.put('/settings/credentials', authenticateToken, settingsLimiter, (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (currentPassword && !bcrypt.compareSync(currentPassword, admin.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newUsername) {
      const existing = db.prepare('SELECT id FROM admin_users WHERE username = ? AND id != ?').get(newUsername, req.user.id);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
    }

    const updates = [];
    const params = [];

    if (newUsername) {
      updates.push('username = ?');
      params.push(newUsername);
    }
    if (newPassword) {
      updates.push('password = ?');
      params.push(bcrypt.hashSync(newPassword, 12));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }

    params.push(req.user.id);
    db.prepare(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const newToken = jwt.sign(
      { id: admin.id, username: newUsername || admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    logActivity('update', 'admin', req.user.id, `Admin credentials updated`);

    res.json({
      success: true,
      message: 'Credentials updated successfully',
      data: {
        token: newToken,
        user: {
          id: admin.id,
          username: newUsername || admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/change-password (first login - forced password change)
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    if (admin.must_change_password !== 1) {
      return res.status(400).json({ success: false, message: 'Password change not required' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE admin_users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashedPassword, req.user.id);

    const newToken = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, mustChangePassword: false },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    logActivity('update', 'admin', req.user.id, 'Password changed on first login');
    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token: newToken,
        user: { id: admin.id, username: admin.username, role: admin.role }
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/forgot-password - Reset password using security question
router.post('/forgot-password', (req, res) => {
  try {
    const { username, answer, newPassword } = req.body;

    if (!username || !answer || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!admin.security_question || !admin.security_answer) {
      return res.status(400).json({ success: false, message: 'No security question set for this user' });
    }

    const normalizedAnswer = answer.trim().toLowerCase();
    const storedAnswer = admin.security_answer.trim().toLowerCase();
    if (normalizedAnswer !== storedAnswer) {
      return res.status(401).json({ success: false, message: 'Incorrect answer' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE admin_users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashedPassword, admin.id);

    logActivity('update', 'admin', admin.id, `Password reset via security question for user '${username}'`);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/security-question?username=xxx - Get security question for a user
router.get('/security-question', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    const db = getDatabase();
    const admin = db.prepare('SELECT security_question FROM admin_users WHERE username = ?').get(username);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!admin.security_question) {
      return res.status(400).json({ success: false, message: 'No security question set' });
    }
    res.json({ success: true, data: { question: admin.security_question } });
  } catch (error) {
    console.error('Get security question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/security-question - Save security question and answer (requires auth)
router.post('/security-question', authenticateToken, (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    if (answer.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Answer is too short' });
    }

    const db = getDatabase();
    db.prepare('UPDATE admin_users SET security_question = ?, security_answer = ? WHERE id = ?')
      .run(question, answer.trim().toLowerCase(), req.user.id);

    logActivity('update', 'admin', req.user.id, `Security question updated`);
    res.json({ success: true, message: 'Security question saved successfully' });
  } catch (error) {
    console.error('Save security question error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/change-password-with-security - Change password + save security question (first login)
router.post('/change-password-with-security', authenticateToken, (req, res) => {
  try {
    const { newPassword, confirmPassword, question, answer } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 12);

    if (question && answer && answer.trim().length >= 2) {
      db.prepare('UPDATE admin_users SET password = ?, must_change_password = 0, security_question = ?, security_answer = ? WHERE id = ?')
        .run(hashedPassword, question, answer.trim().toLowerCase(), req.user.id);
    } else {
      db.prepare('UPDATE admin_users SET password = ?, must_change_password = 0 WHERE id = ?')
        .run(hashedPassword, req.user.id);
    }

    const newToken = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, mustChangePassword: false },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    logActivity('update', 'admin', req.user.id, 'Password changed on first login with security question');

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token: newToken,
        user: { id: admin.id, username: admin.username, role: admin.role }
      }
    });
  } catch (error) {
    console.error('Change password with security error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
