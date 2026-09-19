require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const healthRouter = require('./src/routes/health');
const authRouter = require('./src/routes/auth');
const sessionsRouter = require('./src/routes/sessions');
const metricsRouter = require('./src/routes/metrics');
const importRouter = require('./src/routes/importData');
const errorHandler = require('./src/middleware/errorHandler');
const { requireAuth } = require('./src/middleware/authMiddleware');
const { initDb, readSessions } = require('./src/db/fileDb');
const { ensureDefaultDemoUser } = require('./src/db/usersRepo');
const { seed } = require('./seeds/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Protected routes (require JWT)
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/sessions', requireAuth, metricsRouter);
app.use('/api/import', requireAuth, importRouter);

// Serve static frontend in production (Render deployment)
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  console.log(`📦 Serving static client build from ${clientDist}`);
  app.use(express.static(clientDist));

  // Client-side SPA routing fallback (non-API)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found', path: req.path });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // 404 handler for API routes when running in dev decoupled mode
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
  });
}

// Error handler
app.use(errorHandler);

// Initialize DB files, auto-seed if needed, and start server
initDb().then(async () => {
  // Auto-seed on first launch if empty
  if (process.env.AUTO_SEED !== 'false') {
    try {
      const existing = await readSessions();
      if (!existing || existing.length === 0) {
        console.log('🌱 No sessions found. Auto-seeding initial sample data for Render demo...');
        await seed();
      }
    } catch (seedErr) {
      console.warn('Auto-seed check note:', seedErr.message);
    }
  }

  // Always ensure default demo user exists for seamless login
  try {
    await ensureDefaultDemoUser();
  } catch (userErr) {
    console.warn('Demo user check note:', userErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Load Test Logger API running on http://0.0.0.0:${PORT}`);
    console.log(`📁 Data directory: ${process.env.DATA_DIR || './data'}`);
    console.log(`🔐 Auth enabled — JWT expires in ${process.env.JWT_EXPIRES_IN || '7d'}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
