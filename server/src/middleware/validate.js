/**
 * validate.js — Zod schemas and validation middleware
 */
const { z } = require('zod');

// Session schema
const sessionSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(200),
  targetSystem: z.string().min(1, 'Target system is required').max(200),
  environment: z.enum(['dev', 'staging', 'prod']),
  testTool: z.enum(['JMeter', 'k6', 'Locust', 'Gatling', 'Artillery', 'Other']),
  testerName: z.string().min(1, 'Tester name is required').max(100),
  notes: z.string().max(2000).optional().default(''),
  status: z.enum(['pending', 'running', 'pass', 'fail', 'degraded']).optional().default('pending'),
  breakingPointVU: z.number().int().positive().nullable().optional(),
  errorRateThreshold: z.number().min(0).max(100).optional(),
  p95LatencyThreshold: z.number().min(0).optional(),
  createdAt: z.string().datetime().optional(),
});

const updateSessionSchema = sessionSchema.partial();

// Metric data point schema
const metricSchema = z.object({
  timestamp: z.string().datetime().optional(),
  concurrentUsers: z.number().int().min(0),
  requestsPerSecond: z.number().min(0),
  avgLatency: z.number().min(0),
  p95Latency: z.number().min(0),
  p99Latency: z.number().min(0),
  errorRate: z.number().min(0).max(100),
  cpuUtilization: z.number().min(0).max(100).nullable().optional(),
  memoryUtilization: z.number().min(0).max(100).nullable().optional(),
  isDegradationPoint: z.boolean().optional().default(false),
  notes: z.string().max(500).optional().default(''),
});

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err); // passes to errorHandler
    }
  };
}

module.exports = {
  sessionSchema,
  updateSessionSchema,
  metricSchema,
  validate,
};
