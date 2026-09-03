/**
 * seed.js — Populates sample load test data showing a realistic degradation curve.
 * Stable up to ~500 VUs, degrading 500–800, failing beyond 800.
 * Run with: npm run seed (from /server directory)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { initDb } = require('../src/db/fileDb');
const sessionsRepo = require('../src/db/sessionsRepo');
const metricsRepo = require('../src/db/metricsRepo');

/**
 * Generate a realistic degradation curve metric series.
 * @param {string} sessionId
 * @param {object} opts — customization overrides
 */
function generateMetrics(sessionId, opts = {}) {
  const {
    vuSteps = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 1000],
    stableUpTo = 500,
    failBeyond = 800,
    baseRps = 320,
    baseLatency = 85,
    dateOffset = 0,
  } = opts;

  const metrics = [];
  const baseTime = new Date(Date.now() - dateOffset);

  vuSteps.forEach((vu, i) => {
    const ts = new Date(baseTime.getTime() + i * 5 * 60 * 1000).toISOString(); // 5min apart

    let rps, avgLat, p95Lat, p99Lat, errorRate, cpuUtil, memUtil;

    if (vu <= stableUpTo) {
      // Stable zone: linear throughput growth, low latency, minimal errors
      const scale = vu / stableUpTo;
      rps = Math.round(baseRps * scale + Math.random() * 15);
      avgLat = Math.round(baseLatency + scale * 40 + Math.random() * 20);
      p95Lat = Math.round(avgLat * 1.4 + Math.random() * 30);
      p99Lat = Math.round(p95Lat * 1.2 + Math.random() * 20);
      errorRate = parseFloat((Math.random() * 0.5).toFixed(2));
      cpuUtil = parseFloat((20 + scale * 40 + Math.random() * 5).toFixed(1));
      memUtil = parseFloat((30 + scale * 25 + Math.random() * 5).toFixed(1));
    } else if (vu <= failBeyond) {
      // Degradation zone: throughput plateaus, latency spikes, errors rising
      const degradeFactor = (vu - stableUpTo) / (failBeyond - stableUpTo); // 0→1
      rps = Math.round(baseRps * (1 - degradeFactor * 0.3) + Math.random() * 20);
      avgLat = Math.round(baseLatency * 1.5 + degradeFactor * 1800 + Math.random() * 200);
      p95Lat = Math.round(avgLat * 1.6 + degradeFactor * 500 + Math.random() * 100);
      p99Lat = Math.round(p95Lat * 1.3 + Math.random() * 150);
      errorRate = parseFloat((degradeFactor * 22 + Math.random() * 4).toFixed(2));
      cpuUtil = parseFloat((60 + degradeFactor * 30 + Math.random() * 5).toFixed(1));
      memUtil = parseFloat((55 + degradeFactor * 35 + Math.random() * 5).toFixed(1));
    } else {
      // Failure zone: throughput collapses, latency through the roof, high error rate
      const failFactor = Math.min((vu - failBeyond) / 200, 1);
      rps = Math.round(baseRps * 0.2 * (1 - failFactor * 0.5) + Math.random() * 30);
      avgLat = Math.round(3500 + failFactor * 4000 + Math.random() * 500);
      p95Lat = Math.round(avgLat * 1.8 + Math.random() * 300);
      p99Lat = Math.round(p95Lat * 1.4 + Math.random() * 200);
      errorRate = parseFloat((25 + failFactor * 55 + Math.random() * 8).toFixed(2));
      cpuUtil = parseFloat(Math.min(95 + Math.random() * 5, 100).toFixed(1));
      memUtil = parseFloat(Math.min(88 + failFactor * 12 + Math.random() * 5, 100).toFixed(1));
    }

    metrics.push({
      sessionId,
      timestamp: ts,
      concurrentUsers: vu,
      requestsPerSecond: rps,
      avgLatency: avgLat,
      p95Latency: p95Lat,
      p99Latency: p99Lat,
      errorRate,
      cpuUtilization: cpuUtil,
      memoryUtilization: memUtil,
      isDegradationPoint: vu === stableUpTo + 50, // Flag first degradation point
      notes: vu === stableUpTo + 50 ? 'First signs of degradation detected' : '',
    });
  });

  return metrics;
}

async function seed() {
  console.log('🌱 Starting database seed...');
  await initDb();

  // --- Session 1: Production API — k6 load test (the "benchmark" session)
  const s1 = await sessionsRepo.createSession({
    name: 'Production API Baseline — Q3 2026',
    targetSystem: 'checkout-service.prod.example.com',
    environment: 'prod',
    testTool: 'k6',
    testerName: 'Sarah Chen',
    notes: 'Baseline load test for Q3 capacity planning. Target: 500 stable VUs.',
    status: 'degraded',
    breakingPointVU: 550,
    errorRateThreshold: 5,
    p95LatencyThreshold: 2000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const s1Metrics = generateMetrics(s1.id, { dateOffset: 7 * 24 * 60 * 60 * 1000 });
  await metricsRepo.bulkAddMetrics(s1Metrics);
  console.log(`✅ Session 1 created: ${s1.name} (${s1Metrics.length} data points)`);

  // --- Session 2: Staging after optimization — JMeter
  const s2 = await sessionsRepo.createSession({
    name: 'Checkout Service — Post-Optimization Staging',
    targetSystem: 'checkout-service.staging.example.com',
    environment: 'staging',
    testTool: 'JMeter',
    testerName: 'Marcus Reid',
    notes: 'After DB connection pool and query optimizations. Testing if we can push stable VU beyond 700.',
    status: 'pass',
    breakingPointVU: 750,
    errorRateThreshold: 5,
    p95LatencyThreshold: 2000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const s2Metrics = generateMetrics(s2.id, {
    stableUpTo: 700,
    failBeyond: 900,
    baseRps: 420,
    baseLatency: 65,
    dateOffset: 3 * 24 * 60 * 60 * 1000,
  });
  await metricsRepo.bulkAddMetrics(s2Metrics);
  console.log(`✅ Session 2 created: ${s2.name} (${s2Metrics.length} data points)`);

  // --- Session 3: Locust test in dev — quick smoke test
  const s3 = await sessionsRepo.createSession({
    name: 'Auth Service — Locust Smoke Test',
    targetSystem: 'auth-service.dev.example.com',
    environment: 'dev',
    testTool: 'Locust',
    testerName: 'Priya Nair',
    notes: 'Quick dev smoke test — low VU count. Not a capacity test.',
    status: 'pass',
    errorRateThreshold: 10,
    p95LatencyThreshold: 3000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const s3Metrics = generateMetrics(s3.id, {
    vuSteps: [10, 25, 50, 75, 100, 150, 200, 250, 300],
    stableUpTo: 300,
    failBeyond: 1000,
    baseRps: 120,
    baseLatency: 40,
    dateOffset: 1 * 24 * 60 * 60 * 1000,
  });
  await metricsRepo.bulkAddMetrics(s3Metrics);
  console.log(`✅ Session 3 created: ${s3.name} (${s3Metrics.length} data points)`);

  // --- Session 4: Gatling test in staging — running state
  const s4 = await sessionsRepo.createSession({
    name: 'Payment Gateway — Gatling Stress Test',
    targetSystem: 'payment-gw.staging.example.com',
    environment: 'staging',
    testTool: 'Gatling',
    testerName: 'Alex Johansson',
    notes: 'Stress test for Black Friday preparation. Max load scenario.',
    status: 'running',
    errorRateThreshold: 5,
    p95LatencyThreshold: 1500,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  });

  // Only partial data since it's "running"
  const s4Metrics = generateMetrics(s4.id, {
    vuSteps: [100, 200, 300, 400, 500],
    stableUpTo: 600,
    failBeyond: 900,
    baseRps: 280,
    baseLatency: 95,
    dateOffset: 2 * 60 * 60 * 1000,
  });
  await metricsRepo.bulkAddMetrics(s4Metrics);
  console.log(`✅ Session 4 created: ${s4.name} (${s4Metrics.length} data points)`);

  // --- Session 5: Failed test
  const s5 = await sessionsRepo.createSession({
    name: 'Search Service — Artillery Peak Test',
    targetSystem: 'search-svc.prod.example.com',
    environment: 'prod',
    testTool: 'Artillery',
    testerName: 'Sarah Chen',
    notes: 'Search service collapsed early. Needs caching layer before re-test.',
    status: 'fail',
    breakingPointVU: 300,
    errorRateThreshold: 5,
    p95LatencyThreshold: 2000,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const s5Metrics = generateMetrics(s5.id, {
    vuSteps: [50, 100, 150, 200, 250, 300, 350, 400],
    stableUpTo: 200,
    failBeyond: 300,
    baseRps: 150,
    baseLatency: 110,
    dateOffset: 14 * 24 * 60 * 60 * 1000,
  });
  await metricsRepo.bulkAddMetrics(s5Metrics);
  // --- Demo User
  const usersRepo = require('../src/db/usersRepo');
  try {
    const existingUser = await usersRepo.findByEmail('demo@loadportal.io');
    if (!existingUser) {
      await usersRepo.createUser({
        name: 'Demo Engineer',
        email: 'demo@loadportal.io',
        password: 'Password123!',
        role: 'tester',
      });
      console.log('✅ Demo user created: demo@loadportal.io / Password123!');
    }
  } catch (userErr) {
    console.warn('Note: Demo user setup skipped:', userErr.message);
  }

  console.log('\n🎉 Seed complete! Database populated with 5 load test sessions.');
  console.log('📊 Degradation curves: stable→degraded→fail pattern visible in sessions 1, 2, and 5.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seed, generateMetrics };
