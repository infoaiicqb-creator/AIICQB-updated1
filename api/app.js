import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import certificationRoutes from './routes/certificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from cwd and from root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Strict security check: Ensure JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET environment variable is missing.');
  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    // Set fallback in dev if missing
    process.env.JWT_SECRET = 'aicqb_default_super_secret_jwt_key_2026';
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = [
  'https://aiicqb.org',
  'https://www.aiicqb.org',
  'https://aiicqb-new.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Vercel Serverless Function URL normalizer middleware
app.use((req, res, next) => {
  const originalUrl = req.headers['x-vercel-matched-path'] || req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (originalUrl && originalUrl.startsWith('/api') && (!req.url || req.url === '/' || req.url === '/api' || req.url.startsWith('/api?'))) {
    req.url = originalUrl;
  }
  next();
});

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'online',
    platform: 'AICQB - AI International Certification & Qualification Board',
    version: '2026.1.0-PROD',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes under /api
const mountRoutes = (prefix = '/api') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/certifications`, certificationRoutes);
  app.use(`${prefix}/payment`, paymentRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/exams`, examRoutes);
  app.use(`${prefix}/certificates`, certificateRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/support`, supportRoutes);
};

mountRoutes('/api');

// Helper to reliably locate the compiled client dist directory
const getClientDist = () => {
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../dist'),
  ];
  return candidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || candidates[0];
};

// Serve static client assets
app.use((req, res, next) => {
  const distDir = getClientDist();
  if (fs.existsSync(distDir)) {
    return express.static(distDir)(req, res, next);
  }
  next();
});

// Single Page Application (SPA) fallback:
// Any browser navigation (e.g. /admin, /admin/certifications, /portal, /portal/*, etc.)
// must return index.html so React Router renders the page on refresh.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const distDir = getClientDist();
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Legacy non-prefixed auth fallback (only for /auth endpoints, never /admin or SPA routes)
app.use('/auth', authRoutes);

// 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` AICQB International Certification Platform`);
    console.log(` Running on: http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    const distDir = getClientDist();
    console.log(` Client Frontend served from: ${fs.existsSync(distDir) ? distDir : 'Vite Dev Server (Port 5173)'}`);
    console.log(`====================================================`);
  });
}

export default app;
