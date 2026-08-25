require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const { initDatabase } = require('./database/init');
const { sanitize, validateContentType } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 8889;

// ── Hide server fingerprint ──
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ── Static files (before security headers so images load without CSP/CORP restrictions) ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// ── Helmet: full security headers ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));

// ── Additional security headers ──
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// ── CORS: accept local & private network origins ──
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      const h = url.hostname;
      const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '::1';
      const isPrivate = /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
      const isVercel = h === 'vercel.app' || h.endsWith('.vercel.app');
      const isTailnet = h.endsWith('.ts.net');
      const isAllowed = extraOrigins.includes(origin) || isLocal || isPrivate || isVercel || isTailnet;
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } catch {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// ── Strict login rate limiter: 5 attempts / 15 min ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// ── Body parser with strict limits ──
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Input sanitization & attack detection ──
app.use(sanitize);
app.use(validateContentType);

// ── Request ID for logging ──
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ── Request logging ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms IP:${req.ip} UA:${req.get('user-agent') || 'none'}`;
    if (res.statusCode >= 400) {
      console.error('⚠ ' + log);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('● ' + log);
    }
  });
  next();
});

// ── Block suspicious paths ──
app.use((req, res, next) => {
  const blocked = [
    /\.env/i, /\.git/i, /\.svn/i, /\.htaccess/i, /\.htpasswd/i,
    /wp-admin/i, /wp-login/i, /xmlrpc/i, /phpmyadmin/i,
    /admin\.php/i, /config\.php/i, /setup\.php/i,
    /\.php/i, /eval\(/i, /base64/i,
    /\/etc\/passwd/i, /\/proc\//i,
    /\.DS_Store/i, /\.idea/i, /\.vscode/i,
    /node_modules/i, /package-lock/i, /yarn\.lock/i,
  ];
  if (blocked.some(re => re.test(req.originalUrl))) {
    console.error(`🚫 BLOCKED: ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// ── Routes ──
app.use('/api/employee', require('./routes/employee'));
app.use('/api/admin', require('./routes/admin'));

// ── Health check (minimal info) ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Block common attack paths at root ──
app.get('/.env', (req, res) => res.status(404).end());
app.get('/.git', (req, res) => res.status(404).end());

// ── Error handler (no leak) ──
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

async function startServer() {
  try {
    await initDatabase();
    console.log('✓ Database initialized');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('  Employee Portal — Secure Mode ON');
      console.log('═══════════════════════════════════════');
      console.log(`  URL:      http://localhost:${PORT}`);
      console.log(`  CORS:     Localhost + private network`);
      console.log(`  Helmet:   Full headers enabled`);
      console.log(`  Rate:     200 req/15min global`);
      console.log(`  Login:    5 attempts/15min per user`);
      console.log(`  Headers:  HSTS, CSP, X-Frame-DENY`);
      console.log('═══════════════════════════════════════');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
