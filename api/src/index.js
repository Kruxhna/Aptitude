require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { connectDB } = require('./config/db');
const redis = require('./config/redis');
const mockUserMiddleware = require('./middleware/mockUser');

// Route imports
const healthRoutes = require('./routes/health');
const sprintRoutes = require('./routes/sprint');
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.API_PORT || 3000;

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mockUserMiddleware);

// --- Routes ---
app.use(healthRoutes);
app.use(sprintRoutes);
app.use(userRoutes);
app.use(leaderboardRoutes);

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// --- Start Server ---
async function start() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`✓ API server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});

module.exports = app;
