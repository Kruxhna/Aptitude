require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { connectDB } = require('./config/db');
const redis = require('./config/redis');
const { initQueue } = require('./config/queue');
const { initWorkerHandlers } = require('./services/workerHandlers');
const { initBattleEngine } = require('./services/battleEngine');
const mockUserMiddleware = require('./middleware/mockUser');

// Route imports
const healthRoutes = require('./routes/health');
const sprintRoutes = require('./routes/sprint');
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const analyticsRoutes = require('./routes/analytics');
const onboardingRoutes = require('./routes/onboarding');
const friendRoutes = require('./routes/friends');
const leagueRoutes = require('./routes/leagues');
const pathRoutes = require('./routes/path');
const mascotRoutes = require('./routes/mascot');
const shopRoutes = require('./routes/shop');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.API_PORT || 3000;

// --- Middleware ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());
app.use(mockUserMiddleware);

// --- Static Assets (Spatial Images) ---
app.use(express.static(path.join(__dirname, '../public')));
app.use('/spatial', express.static(path.join(__dirname, '../public/spatial')));

// --- Routes ---
app.use(healthRoutes);
app.use(sprintRoutes);
app.use(userRoutes);
app.use(leaderboardRoutes);
app.use(analyticsRoutes.router);
app.use(onboardingRoutes);
app.use(friendRoutes);
app.use(leagueRoutes);
app.use(pathRoutes);
app.use(mascotRoutes);
app.use(shopRoutes);
app.use(notificationRoutes);

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const server = http.createServer(app);

// --- Start Server ---
async function start() {
  await connectDB();

  // Initialize BullMQ Queue & Worker Handlers
  initQueue();
  initWorkerHandlers();

  // Initialize 1v1 WebSocket Battle Engine
  initBattleEngine(server);

  server.listen(PORT, () => {
    console.log(`✓ API server & WebSockets running on port ${PORT}`);
  });
}

// In test mode we export app without binding port
if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('Failed to start API server:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.server = server;
