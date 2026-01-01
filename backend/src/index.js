import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { getPool } from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());

// ============ CORS ============
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============ BODY PARSER ============
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ============ STATIC ASSETS (logo / favicon) ============
// Place your site logo as `public/logo.png` and favicon as `public/favicon.ico`.
app.use(express.static('public'));

// ============ LOGGING ============
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit auth attempts
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// ============ ROOT / WELCOME ============
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Safe Bazaar AI Backend',
    api: '/api',
    health: '/health',
    docs: 'https://github.com/JustiNoel/safe-bazaar-ai'
  });
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// ============ API DOCUMENTATION ============
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Safe Bazaar AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      scans: '/api/scans',
      subscriptions: '/api/subscriptions',
      admin: '/api/admin (requires admin privileges)',
    },
    documentation: 'https://github.com/JustiNoel/safe-bazaar-ai',
  });
});

// ============ 404 HANDLER ============
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    method: req.method,
  });
});

// ============ ERROR HANDLER ============
app.use((error, req, res, next) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = NODE_ENV === 'development' ? error.message : 'Internal server error';

  res.status(statusCode).json({
    error: error.name || 'Error',
    message,
    ...(NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ============ DATABASE CONNECTION & START SERVER ============
const pool = getPool();

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    console.log('✓ Database connected at', res.rows[0].now);

    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        Safe Bazaar AI - Backend Server                         ║
║        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ║
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║  🌍 Environment: ${NODE_ENV}                                        ║
║  📚 API Docs: http://localhost:${PORT}/api                      ║
║  💚 Health Check: http://localhost:${PORT}/health               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown (use server.close since `app` is not an HTTP server)
    const gracefulShutdown = () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        pool.end();
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
});

export default app;
