/**
 * sessionsRepo.js — Repository for Load Test Sessions
 */
const { v4: uuidv4 } = require('uuid');
const { readSessions, writeSessions } = require('./fileDb');

/**
 * Get all sessions, optionally filtered.
 * Filters: environment, status, dateFrom, dateTo
 */
async function getAllSessions(filters = {}) {
  let sessions = await readSessions();

  if (filters.environment) {
    sessions = sessions.filter(s => s.environment === filters.environment);
  }
  if (filters.status) {
    sessions = sessions.filter(s => s.status === filters.status);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    sessions = sessions.filter(s => new Date(s.createdAt).getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    sessions = sessions.filter(s => new Date(s.createdAt).getTime() <= to);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    sessions = sessions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.targetSystem.toLowerCase().includes(q) ||
      s.testerName.toLowerCase().includes(q)
    );
  }

  return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a single session by ID.
 */
async function getSessionById(id) {
  const sessions = await readSessions();
  return sessions.find(s => s.id === id) || null;
}

/**
 * Create a new session.
 */
async function createSession(data) {
  const sessions = await readSessions();
  const now = new Date().toISOString();

  const session = {
    id: uuidv4(),
    name: data.name,
    targetSystem: data.targetSystem,
    environment: data.environment || 'staging',
    testTool: data.testTool || 'k6',
    testerName: data.testerName || 'Unknown',
    notes: data.notes || '',
    status: data.status || 'pending',
    breakingPointVU: data.breakingPointVU || null,
    errorRateThreshold: data.errorRateThreshold || parseFloat(process.env.ERROR_RATE_THRESHOLD) || 5,
    p95LatencyThreshold: data.p95LatencyThreshold || parseFloat(process.env.P95_LATENCY_THRESHOLD) || 2000,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  sessions.push(session);
  await writeSessions(sessions);
  return session;
}

/**
 * Update an existing session.
 */
async function updateSession(id, data) {
  const sessions = await readSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;

  const updated = {
    ...sessions[idx],
    ...data,
    id, // protect id
    updatedAt: new Date().toISOString(),
  };

  sessions[idx] = updated;
  await writeSessions(sessions);
  return updated;
}

/**
 * Delete a session by ID.
 */
async function deleteSession(id) {
  const sessions = await readSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return false;

  sessions.splice(idx, 1);
  await writeSessions(sessions);
  return true;
}

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
};
