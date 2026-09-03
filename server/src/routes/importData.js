/**
 * importData.js — POST /api/import
 * Accepts JSON body or CSV file upload and bulk-inserts metrics into a session.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const sessionsRepo = require('../db/sessionsRepo');
const { bulkAddMetrics } = require('../db/metricsRepo');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json' ||
        file.originalname.endsWith('.csv') || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are supported'));
    }
  },
});

/**
 * Normalize a raw row (from CSV or JSON) into our internal metric schema.
 * Supports common JMeter / k6 column naming conventions.
 */
function normalizeRow(row, sessionId) {
  return {
    sessionId,
    timestamp: row.timestamp || row.timeStamp || row.time || new Date().toISOString(),
    concurrentUsers: parseFloat(row.concurrentUsers || row.vus || row.users || row.threads || 0),
    requestsPerSecond: parseFloat(row.requestsPerSecond || row.rps || row.throughput || row.Throughput || 0),
    avgLatency: parseFloat(row.avgLatency || row.avg || row.Average || row.response_time_avg || 0),
    p95Latency: parseFloat(row.p95Latency || row.p95 || row['95th'] || row['95%'] || row.response_time_p95 || 0),
    p99Latency: parseFloat(row.p99Latency || row.p99 || row['99th'] || row['99%'] || row.response_time_p99 || 0),
    errorRate: parseFloat(row.errorRate || row.error_rate || row.Error || row.errorPercent || 0),
    cpuUtilization: row.cpuUtilization || row.cpu != null ? parseFloat(row.cpuUtilization || row.cpu) : null,
    memoryUtilization: row.memoryUtilization || row.memory != null ? parseFloat(row.memoryUtilization || row.memory) : null,
    isDegradationPoint: row.isDegradationPoint === 'true' || row.isDegradationPoint === true || false,
    notes: row.notes || row.label || '',
  };
}

// POST /api/import — bulk import via file upload (multipart) or raw JSON body
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId || req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required (body or query param)' });
    }

    const session = await sessionsRepo.getSessionById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let rows = [];

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      const ext = req.file.originalname.split('.').pop().toLowerCase();

      if (ext === 'csv') {
        rows = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } else if (ext === 'json') {
        const parsed = JSON.parse(content);
        rows = Array.isArray(parsed) ? parsed : parsed.metrics || parsed.data || [];
      }
    } else if (req.body.metrics && Array.isArray(req.body.metrics)) {
      rows = req.body.metrics;
    } else {
      return res.status(400).json({ error: 'Provide a CSV/JSON file or a metrics array in the request body' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data rows found in the imported file' });
    }

    const normalized = rows.map(row => normalizeRow(row, sessionId));
    const inserted = await bulkAddMetrics(normalized);

    res.status(201).json({
      message: `Successfully imported ${inserted.length} metric data points`,
      count: inserted.length,
      sessionId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
