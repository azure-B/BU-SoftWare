require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const swaggerUi  = require('swagger-ui-express');

const logger                     = require('./middlewares/logger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { globalLimiter }          = require('./middlewares/rateLimit');
const swaggerSpec                = require('./config/swagger');

const homeRouter    = require('./routes/homeRouter');
const userRouter    = require('./routes/userRouter');
const postRouter    = require('./routes/postRouter');
const counterRouter = require('./routes/counterRouter');
const authRouter     = require('./routes/authRouter');
const registerRouter = require('./routes/registerRouter');
const recoverRouter = require('./routes/recoverRouter');
const communityRouter  = require('./routes/communityRouter');
const reservationRouter = require('./routes/reservationRouter');
const dashboardRouter = require('./routes/dashboardRouter');
const tourRouter = require('./routes/tourRouter');
const faqRouter = require('./routes/faqRouter');
const { startTourMaintenanceJob } = require('./jobs/tourMaintenanceJob');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isDemoRoutesEnabled = !isProduction || process.env.ENABLE_DEMO_ROUTES === 'true';

if (isProduction) {
  app.set('trust proxy', 1);
}

// ── CORS ───────────────────────────────────────────
// 운영: CORS_ORIGIN 필수 (예: https://bustudent.netlify.app)
// 개발: 미설정 시 * 허용
function resolveCorsOrigin() {
  const raw = process.env.CORS_ORIGIN;

  if (!raw) {
    return isProduction ? false : '*';
  }

  if (raw === '*') {
    return isProduction ? false : '*';
  }

  const allowed = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowed.length <= 1) return allowed[0] || false;

  return (origin, callback) => {
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

const corsOrigin = resolveCorsOrigin();
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Middleware ─────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(globalLimiter);
app.use(logger);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// ── Static ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/front', express.static(path.join(__dirname, '../front')));

// ── API docs (개발 전용) ────────────────────────────
if (!isProduction) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ── Routes ────────────────────────────────────────
app.use('/',            homeRouter);
app.use('/api/auth',        authRouter);
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/recover', recoverRouter);
app.use('/api/community', communityRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/tour', tourRouter);
app.use('/api/faq', faqRouter);

if (isDemoRoutesEnabled) {
  app.use('/api/users',   userRouter);
  app.use('/api/posts',     postRouter);
  app.use('/api/counter',   counterRouter);
}

// ── Error ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start (테스트 환경에서는 listen 하지 않음) ─────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  if (isProduction && !process.env.JWT_SECRET) {
    console.error('\n❌  JWT_SECRET is required in production.\n');
    process.exit(1);
  }

  if (isProduction && !process.env.CORS_ORIGIN) {
    console.warn('\n⚠️  CORS_ORIGIN is not set — cross-origin requests will be blocked.\n');
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀  http://localhost:${PORT}`);
    console.log(`🌐  CORS   → ${String(corsOrigin)}`);
    console.log(`📁  Front  → http://localhost:${PORT}/front/pages/home.html`);
    if (isDemoRoutesEnabled) {
      console.log(`🔌  Demo   → http://localhost:${PORT}/api/users`);
    }
    if (!isProduction) {
      console.log(`📖  Docs   → http://localhost:${PORT}/api-docs\n`);
    }
    startTourMaintenanceJob();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌  Port ${PORT} is already in use.`);
      console.error('    Run: npm run dev   (auto-kills old process on Windows)');
      console.error('    Or:  node scripts/kill-port.js 5000\n');
      process.exit(1);
    }
    throw err;
  });
}

module.exports = app;
