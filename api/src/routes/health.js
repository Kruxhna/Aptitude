const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Health check endpoint for Docker Compose and monitoring.
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
