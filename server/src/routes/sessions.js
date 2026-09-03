const express = require('express');
const router = express.Router();
const sessionsRepo = require('../db/sessionsRepo');
const { deleteMetricsBySession } = require('../db/metricsRepo');
const { validate, sessionSchema, updateSessionSchema } = require('../middleware/validate');

// GET /api/sessions — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { environment, status, dateFrom, dateTo, search } = req.query;
    const sessions = await sessionsRepo.getAllSessions({ environment, status, dateFrom, dateTo, search });
    res.json({ data: sessions, total: sessions.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id — get single session
router.get('/:id', async (req, res, next) => {
  try {
    const session = await sessionsRepo.getSessionById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions — create session
router.post('/', validate(sessionSchema), async (req, res, next) => {
  try {
    const session = await sessionsRepo.createSession(req.body);
    res.status(201).json({ data: session, message: 'Session created successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sessions/:id — update session
router.put('/:id', validate(updateSessionSchema), async (req, res, next) => {
  try {
    const session = await sessionsRepo.updateSession(req.params.id, req.body);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: session, message: 'Session updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:id — delete session + cascade delete metrics
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await sessionsRepo.deleteSession(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Session not found' });
    // Cascade: remove all metrics for this session
    await deleteMetricsBySession(req.params.id);
    res.json({ message: 'Session and associated metrics deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
