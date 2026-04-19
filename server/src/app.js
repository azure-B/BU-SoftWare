require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');

const logger                     = require('./middlewares/logger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const homeRouter    = require('./routes/homeRouter');
const userRouter    = require('./routes/userRouter');
const postRouter    = require('./routes/postRouter');
const counterRouter = require('./routes/counterRouter');

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

// ── Routes ────────────────────────────────────────
app.use('/',            homeRouter);
app.use('/api/users',   userRouter);
app.use('/api/posts',   postRouter);
app.use('/api/counter', counterRouter);

// ── Error ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start (테스트 환경에서는 listen 하지 않음) ─────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀  http://localhost:${PORT}`);
    console.log(`🌐  CORS   → ${corsOrigin}`);
    console.log(`📁  Front  → http://localhost:${PORT}/front/pages/home.html`);
    console.log(`🔌  API    → http://localhost:${PORT}/api/users\n`);
  });
}

module.exports = app;
