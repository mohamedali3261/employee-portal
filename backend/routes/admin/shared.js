const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../../database/init');

// ── Login rate limiter: 5 attempts / 15 min per user+IP ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  keyGenerator: (req) => req.ip + ':' + (req.body?.username || 'unknown'),
});

// ── Settings rate limiter: 5 changes / hour ──
const settingsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many changes. Try again in 1 hour.' },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
['employees', 'documents'].forEach(sub => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Combined storage that routes files by field name
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'profile_image' ? 'employees' : 'documents';
    cb(null, path.join(uploadsDir, sub));
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'profile_image') {
      const employeeId = req.body.employee_id || req.params.id || Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, employeeId + ext);
    } else {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, unique + ext);
    }
  }
});

const upload = multer({ storage: fileStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Log activity helper (async, fire-and-forget)
const logActivity = (action, entity, entityId, details) => {
  (async () => {
    try {
      const db = getDatabase();
      await db.prepare('INSERT INTO activity_log (action, entity, entity_id, details) VALUES (?, ?, ?, ?)')
        .run(action, entity, entityId, details);
    } catch (error) {
      console.error('Activity log error:', error);
    }
  })();
};

module.exports = {
  loginLimiter,
  settingsLimiter,
  upload,
  logActivity
};
