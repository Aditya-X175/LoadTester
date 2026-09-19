/**
 * fileDb.js — Atomic JSON file storage layer
 * Uses temp-file-rename strategy to avoid corruption on concurrent writes.
 */
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const os = require('os');

function resolveDataDir() {
  if (process.env.DATA_DIR) {
    if (path.isAbsolute(process.env.DATA_DIR)) return process.env.DATA_DIR;
    const fromCwd = path.resolve(process.env.DATA_DIR);
    if (fs.existsSync(fromCwd)) return fromCwd;
  }
  return path.resolve(__dirname, '..', '..', 'data');
}

const DATA_DIR = resolveDataDir();

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const METRICS_FILE = path.join(DATA_DIR, 'metrics.json');

// In-memory write lock per file to prevent concurrent overwrites
const writeLocks = {};

/**
 * Ensure the data directory and default JSON files exist.
 */
async function initDb() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  if (!fs.existsSync(SESSIONS_FILE)) {
    await fsp.writeFile(SESSIONS_FILE, JSON.stringify({ sessions: [] }, null, 2), 'utf-8');
  }
  if (!fs.existsSync(METRICS_FILE)) {
    await fsp.writeFile(METRICS_FILE, JSON.stringify({ metrics: [] }, null, 2), 'utf-8');
  }
  console.log(`✅ Database initialized at ${DATA_DIR}`);
}

/**
 * Read a JSON file and return parsed content.
 */
async function readJson(filePath) {
  const raw = await fsp.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Atomically write JSON to a file using a temp file + rename.
 * Uses a per-file lock to serialize concurrent writes.
 */
async function writeJson(filePath, data) {
  // Simple mutex using a promise chain per file
  if (!writeLocks[filePath]) {
    writeLocks[filePath] = Promise.resolve();
  }

  writeLocks[filePath] = writeLocks[filePath].then(async () => {
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });
    const tmpFile = path.join(dir, `ltp-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    await fsp.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    await fsp.rename(tmpFile, filePath);
  });

  return writeLocks[filePath];
}

/**
 * High-level helpers for sessions and metrics collections.
 */
async function readSessions() {
  const db = await readJson(SESSIONS_FILE);
  return db.sessions || [];
}

async function writeSessions(sessions) {
  await writeJson(SESSIONS_FILE, { sessions });
}

async function readMetrics() {
  const db = await readJson(METRICS_FILE);
  return db.metrics || [];
}

async function writeMetrics(metrics) {
  await writeJson(METRICS_FILE, { metrics });
}

module.exports = {
  initDb,
  readSessions,
  writeSessions,
  readMetrics,
  writeMetrics,
  SESSIONS_FILE,
  METRICS_FILE,
  DATA_DIR,
};
