const express = require('express');
const cors = require('cors');
const { initDb, saveDb } = require('./db/database');
const { initDatabase } = require('./db/init');
const { authMiddleware } = require('./middleware/auth');
const { logMiddleware } = require('./middleware/logger');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const assetRoutes = require('./routes/assets');
const borrowRoutes = require('./routes/borrow');
const scrapRoutes = require('./routes/scrap');
const logRoutes = require('./routes/logs');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = 8001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, logMiddleware, userRoutes);
app.use('/api/categories', authMiddleware, logMiddleware, categoryRoutes);
app.use('/api/assets', authMiddleware, logMiddleware, assetRoutes);
app.use('/api/borrow', authMiddleware, logMiddleware, borrowRoutes);
app.use('/api/scrap', authMiddleware, logMiddleware, scrapRoutes);
app.use('/api/logs', authMiddleware, logMiddleware, logRoutes);
app.use('/api/statistics', authMiddleware, statisticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

async function start() {
  try {
    await initDb();
    initDatabase();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log(`Asset Management Backend Server running on http://localhost:${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    });

    process.on('SIGINT', () => {
      saveDb();
      console.log('Database saved. Server shutting down.');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      saveDb();
      console.log('Database saved. Server shutting down.');
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
