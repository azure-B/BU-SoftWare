require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');

const logger                     = require('./middlewares/logger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const swaggerSpec                = require('./config/swagger');

const homeRouter    = require('./routes/homeRouter');
const userRouter    = require('./routes/userRouter');
const postRouter    = require('./routes/postRouter');
const counterRouter = require('./routes/counterRouter');
const authRouter     = require('./routes/authRouter');
const registerRouter = require('./routes/registerRouter');
const communityRouter  = require('./routes/communityRouter');
const reservationRouter = require('./routes/reservationRouter');
const dashboardRouter = require('./routes/dashboardRouter');
const tourRouter = require('./routes/tourRouter');
const { startTourMaintenanceJob } = require('./jobs/tourMaintenanceJob');

const app = express();

// ── CORS ───────────────────────────────────────────
// CORS_ORIGIN=* 이면 전체 허용, 아니면 .env 값만 허용
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Middleware ─────────────────────────────────────
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/front', express.static(path.join(__dirname, '../front')));

// ── API docs ──────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────
app.use('/',            homeRouter);
app.use('/api/auth',        authRouter);
app.use('/api/auth/register', registerRouter);
app.use('/api/users',   userRouter);
app.use('/api/posts',     postRouter);
app.use('/api/community', communityRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/tour', tourRouter);
app.use('/api/counter',   counterRouter);

// ── Error ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start (테스트 환경에서는 listen 하지 않음) ─────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`\n🚀  http://localhost:${PORT}`);
    console.log(`🌐  CORS   → ${corsOrigin}`);
    console.log(`📁  Front  → http://localhost:${PORT}/front/pages/home.html`);
    console.log(`🔌  API    → http://localhost:${PORT}/api/users`);
    console.log(`📖  Docs   → http://localhost:${PORT}/api-docs\n`);
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
