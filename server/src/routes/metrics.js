const express = require('express');
const router = express.Router();
const metricsRepo = require('../db/metricsRepo');
const sessionsRepo = require('../db/sessionsRepo');
const { validate, metricSchema } = require('../middleware/validate');

// GET /api/sessions/:id/metrics — list all data points for a session
router.get('/:id/metrics', async (req, res, next) => {
  try {
    const session = await sessionsRepo.getSessionById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const metrics = await metricsRepo.getMetricsBySession(req.params.id);
    res.json({ data: metrics, total: metrics.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/metrics — add a single data point
router.post('/:id/metrics', validate(metricSchema), async (req, res, next) => {
  try {
    const session = await sessionsRepo.getSessionById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const metric = await metricsRepo.addMetric(req.params.id, req.body);

    // Auto-update session status based on thresholds
    const errorThreshold = session.errorRateThreshold ?? 5;
    const p95Threshold = session.p95LatencyThreshold ?? 2000;
    let newStatus = session.status;

    if (metric.errorRate > errorThreshold || metric.p95Latency > p95Threshold) {
      newStatus = metric.errorRate > 20 ? 'fail' : 'degraded';
    } else if (session.status === 'pending') {
      newStatus = 'running';
    }

    if (newStatus !== session.status) {
      await sessionsRepo.updateSession(req.params.id, { status: newStatus });
    }

    res.status(201).json({ data: metric, message: 'Metric data point added' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:id/metrics/:metricId — delete a single data point
router.delete('/:id/metrics/:metricId', async (req, res, next) => {
  try {
    const deleted = await metricsRepo.deleteMetric(req.params.metricId);
    if (!deleted) return res.status(404).json({ error: 'Metric not found' });
    res.json({ message: 'Metric deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/summary — computed stats
router.get('/:id/summary', async (req, res, next) => {
  try {
    const session = await sessionsRepo.getSessionById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const summary = await metricsRepo.computeSummary(req.params.id, session);
    res.json({ data: { session, ...summary } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
