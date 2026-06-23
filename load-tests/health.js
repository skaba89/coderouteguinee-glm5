// ============================================================
// CodeRoute Guinée — k6 Load Test: Health Endpoint (Sprint 3)
// ============================================================
// Tests the /api/health endpoint under load. This endpoint is
// hit by UptimeRobot every 30s and k8s liveness probes every 10s
// — it MUST stay fast (<50ms p95) and never crash.
//
// Run:
//   k6 run --vus 50 --duration 30s load-tests/health.js
//
// Env:
//   BASE_URL  — target host (default http://localhost:3000)
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('health_errors');
const latencyTrend = new Trend('health_latency_ms', true);

// Test options — ramp up, hold, ramp down
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // ramp up to 50 VUs
    { duration: '30s', target: 50 },   // hold at 50 VUs
    { duration: '10s', target: 100 },  // spike to 100 VUs
    { duration: '20s', target: 100 },  // hold at 100 VUs
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    // Health endpoint MUST be fast and reliable
    http_req_duration: ['p(95)<200', 'p(99)<500'],   // 95% under 200ms, 99% under 500ms
    http_req_failed: ['rate<0.001'],                  // <0.1% failures (1 in 1000)
    health_errors: ['rate<0.001'],
  },
};

export default function () {
  const start = Date.now();

  // Use ?quick=true for the liveness probe mode (skips DB check)
  const response = http.get(`${BASE_URL}/api/health?quick=true`, {
    tags: { name: 'health_quick' },
  });

  const latency = Date.now() - start;
  latencyTrend.add(latency);

  const ok = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch (e) {
        return false;
      }
    },
    'response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!ok);

  // 0.1s sleep between requests per VU
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    'load-tests/results/health-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const metrics = data.metrics || {};
  const duration = metrics.http_req_duration?.values || {};
  const failed = metrics.http_req_failed?.values || {};
  return `
╔══════════════════════════════════════════════════════════╗
║  k6 Health Endpoint Load Test — Summary                  ║
╚══════════════════════════════════════════════════════════╝
  Requests:     ${metrics.http_reqs?.values.count || 0}
  Failures:    ${(failed.rate * 100).toFixed(2)}%
  Duration p50: ${duration['p(50)']?.toFixed(2) || 'N/A'} ms
  Duration p95: ${duration['p(95)']?.toFixed(2) || 'N/A'} ms
  Duration p99: ${duration['p(99)']?.toFixed(2) || 'N/A'} ms
  VUs max:     ${metrics.vus_max?.values.max || 0}
`;
}
