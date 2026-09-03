/**
 * metricsRepo.js — Repository for per-session metric data points
 */
const { v4: uuidv4 } = require('uuid');
const { readMetrics, writeMetrics } = require('./fileDb');

/**
 * Get all metrics for a given sessionId, sorted by timestamp.
 */
async function getMetricsBySession(sessionId) {
  const metrics = await readMetrics();
  return metrics
    .filter(m => m.sessionId === sessionId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Add a single metric data point to a session.
 */
async function addMetric(sessionId, data) {
  const metrics = await readMetrics();
  const now = new Date().toISOString();

  const metric = {
    id: uuidv4(),
    sessionId,
    timestamp: data.timestamp || now,
    concurrentUsers: Number(data.concurrentUsers) || 0,
    requestsPerSecond: Number(data.requestsPerSecond) || 0,
    avgLatency: Number(data.avgLatency) || 0,
    p95Latency: Number(data.p95Latency) || 0,
    p99Latency: Number(data.p99Latency) || 0,
    errorRate: Number(data.errorRate) || 0,
    cpuUtilization: data.cpuUtilization != null ? Number(data.cpuUtilization) : null,
    memoryUtilization: data.memoryUtilization != null ? Number(data.memoryUtilization) : null,
    isDegradationPoint: Boolean(data.isDegradationPoint) || false,
    notes: data.notes || '',
    createdAt: now,
  };

  metrics.push(metric);
  await writeMetrics(metrics);
  return metric;
}

/**
 * Bulk insert metrics (used by import and seed).
 */
async function bulkAddMetrics(metricsToAdd) {
  const metrics = await readMetrics();
  const now = new Date().toISOString();

  const newMetrics = metricsToAdd.map(data => ({
    id: uuidv4(),
    sessionId: data.sessionId,
    timestamp: data.timestamp || now,
    concurrentUsers: Number(data.concurrentUsers) || 0,
    requestsPerSecond: Number(data.requestsPerSecond) || 0,
    avgLatency: Number(data.avgLatency) || 0,
    p95Latency: Number(data.p95Latency) || 0,
    p99Latency: Number(data.p99Latency) || 0,
    errorRate: Number(data.errorRate) || 0,
    cpuUtilization: data.cpuUtilization != null ? Number(data.cpuUtilization) : null,
    memoryUtilization: data.memoryUtilization != null ? Number(data.memoryUtilization) : null,
    isDegradationPoint: Boolean(data.isDegradationPoint) || false,
    notes: data.notes || '',
    createdAt: now,
  }));

  const combined = [...metrics, ...newMetrics];
  await writeMetrics(combined);
  return newMetrics;
}

/**
 * Delete a single metric point by ID.
 */
async function deleteMetric(id) {
  const metrics = await readMetrics();
  const idx = metrics.findIndex(m => m.id === id);
  if (idx === -1) return false;
  metrics.splice(idx, 1);
  await writeMetrics(metrics);
  return true;
}

/**
 * Delete all metrics belonging to a session (used when deleting a session).
 */
async function deleteMetricsBySession(sessionId) {
  const metrics = await readMetrics();
  const remaining = metrics.filter(m => m.sessionId !== sessionId);
  await writeMetrics(remaining);
  return true;
}

/**
 * Compute summary statistics for a session's metrics.
 */
async function computeSummary(sessionId, session) {
  const metrics = await getMetricsBySession(sessionId);

  if (metrics.length === 0) {
    return {
      sessionId,
      totalDataPoints: 0,
      maxConcurrentUsers: 0,
      peakThroughput: 0,
      avgErrorRate: 0,
      breakingPointVU: session?.breakingPointVU || null,
      degradationPoints: [],
      summary: null,
    };
  }

  const errorThreshold = session?.errorRateThreshold ?? 5;
  const p95Threshold = session?.p95LatencyThreshold ?? 2000;

  const maxConcurrentUsers = Math.max(...metrics.map(m => m.concurrentUsers));
  const peakThroughput = Math.max(...metrics.map(m => m.requestsPerSecond));
  const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

  // Auto-detect degradation: first point where error > threshold OR p95 exceeds threshold
  const degradationPoints = metrics.filter(m =>
    m.errorRate > errorThreshold || m.p95Latency > p95Threshold || m.isDegradationPoint
  );

  const firstDegradation = degradationPoints.length > 0
    ? degradationPoints.sort((a, b) => a.concurrentUsers - b.concurrentUsers)[0]
    : null;

  // Max stable users = max VU before first degradation
  const stableMetrics = firstDegradation
    ? metrics.filter(m => m.concurrentUsers < firstDegradation.concurrentUsers)
    : metrics;
  const maxStableUsers = stableMetrics.length > 0
    ? Math.max(...stableMetrics.map(m => m.concurrentUsers))
    : maxConcurrentUsers;

  const avgDegradationLatency = degradationPoints.length > 0
    ? degradationPoints.reduce((sum, m) => sum + m.avgLatency, 0) / degradationPoints.length
    : 0;

  return {
    sessionId,
    totalDataPoints: metrics.length,
    maxConcurrentUsers,
    maxStableUsers,
    peakThroughput: Math.round(peakThroughput * 100) / 100,
    avgErrorRate: Math.round(avgErrorRate * 100) / 100,
    breakingPointVU: session?.breakingPointVU || (firstDegradation?.concurrentUsers ?? null),
    avgDegradationLatency: Math.round(avgDegradationLatency),
    degradationPoints: degradationPoints.map(d => ({ id: d.id, vu: d.concurrentUsers, errorRate: d.errorRate, p95: d.p95Latency })),
    thresholds: { errorRate: errorThreshold, p95Latency: p95Threshold },
  };
}

module.exports = {
  getMetricsBySession,
  addMetric,
  bulkAddMetrics,
  deleteMetric,
  deleteMetricsBySession,
  computeSummary,
};
