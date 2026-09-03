const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Load Test Logger API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
