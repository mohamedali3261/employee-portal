const crypto = require('crypto');

// ── XSS-safe HTML entity encoding ──
const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'/]/g, c => htmlEntities[c]);
}

// ── Detect SQL injection patterns ──
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE|UNION|FETCH|DECLARE|TRUNCATE|GRANT|REVOKE)\b)/i,
  /(--|#|\/\*|\*\/|;)/,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  /('|")(;?\s*(DROP|ALTER|CREATE|EXEC))/i,
  /CHAR\s*\(/i,
  /CONCAT\s*\(/i,
  /0x[0-9a-f]+/i,
  /benchmark\s*\(/i,
  /sleep\s*\(/i,
  /waitfor\s+delay/i,
  /load_file\s*\(/i,
  /into\s+(out|dump)file/i,
];

function detectSqlInjection(value) {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(p => p.test(value));
}

// ── Detect common attack payloads ──
const ATTACK_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /eval\s*\(/i,
  /document\.(cookie|domain|write)/i,
  /window\.(location|open)/i,
  /\.\.\/\.\.\//,
  /%2e%2e/i,
];

function detectAttackPayload(value) {
  if (typeof value !== 'string') return false;
  return ATTACK_PATTERNS.some(p => p.test(value));
}

// ── Sanitize string input ──
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/\0/g, '')
    .substring(0, 5000);
}

// ── Deep-sanitize object values ──
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeString(v) : v);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ── Deep-check object for attacks ──
function checkObjectForAttacks(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (detectSqlInjection(value)) return `SQL injection detected in field '${key}'`;
      if (detectAttackPayload(value)) return `XSS/attack payload detected in field '${key}'`;
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'string') {
          if (detectSqlInjection(v)) return `SQL injection detected in field '${key}'`;
          if (detectAttackPayload(v)) return `XSS/attack payload detected in field '${key}'`;
        }
      }
    }
  }
  return null;
}

// ── Main sanitization middleware ──
function sanitize(req, res, next) {
  if (req.body) {
    const attack = checkObjectForAttacks(req.body);
    if (attack) {
      console.error(`🚫 ATTACK BLOCKED from ${req.ip}: ${attack}`);
      return res.status(400).json({ success: false, message: 'Invalid input detected' });
    }
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    const attack = checkObjectForAttacks(req.query);
    if (attack) {
      console.error(`🚫 ATTACK BLOCKED from ${req.ip}: ${attack}`);
      return res.status(400).json({ success: false, message: 'Invalid input detected' });
    }
  }

  if (req.params) {
    const attack = checkObjectForAttacks(req.params);
    if (attack) {
      console.error(`🚫 ATTACK BLOCKED from ${req.ip}: ${attack}`);
      return res.status(400).json({ success: false, message: 'Invalid input detected' });
    }
  }

  next();
}

// ── CSRF-like protection: check Content-Type on mutations ──
function validateContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      return res.status(415).json({ success: false, message: 'Unsupported Media Type' });
    }
  }
  next();
}

// ── Generate CSRF token ──
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Timing-safe comparison ──
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  sanitize,
  validateContentType,
  escapeHtml,
  detectSqlInjection,
  detectAttackPayload,
  sanitizeString,
  generateCsrfToken,
  timingSafeCompare,
};
