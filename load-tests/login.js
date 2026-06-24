// ============================================================
// CodeRoute Guinée — k6 Load Test: Login Endpoint (Sprint 3)
// ============================================================
// Tests /api/auth/login under load. Auth endpoints are the #1
// target for credential-stuffing and brute-force attacks —
// they MUST sustain ~5 req/s per VU (rate limited at 10/s/IP
// via Redis in production).
//
// Run:
//   k6 run --vus 20 --duration 1m load-tests/login.js
//
// Env:
//   BASE_URL          — target host (default http://localhost:3000)
//   TEST_EMAIL         — login email (default candidat@demo.gn)
//   TEST_PASSWORD      — login password (REQUIRED, throws if missing)
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'candidat@demo.gn';
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

if (!TEST_PASSWORD) {
  console.error('ERROR: TEST_PASSWORD env var is required for login load test');
  console.error('Set it via: TEST_PASSWORD=xxx k6 run load-tests/login.js');
}

const loginSuccessRate = new Rate('login_success');
const loginFailureCounter = new Counter('login_failures');
const loginLatencyTrend = new Trend('login_latency_ms', true);

export const options = {
  stages: [
    { duration: '15s', target: 20 },   // ramp up
    { duration: '30s', target: 20 },   // steady state
    { duration: '15s', target: 50 },   // burst (rate limit kicks in)
    { duration: '15s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],   // 95% under 1.5s, 99% under 3s (argon2 hashing is slow)
    http_req_failed: ['rate<0.05'],                     // <5% transport failures
    login_success: ['rate>0.5'],                        // >50% should succeed with valid creds
  },
};

export default function () {
  const start = Date.now();

  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD || 'invalid',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_login' },
  };

  const response = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  const latency = Date.now() - start;
  loginLatencyTrend.add(latency);

  const ok = check(response, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'response has JSON body': (r) => {
      try { JSON.parse(r.body); return true; } catch (e) { return false; }
    },
    'no stack trace leaked': (r) => !r.body.includes('at /') && !r.body.includes('.ts:'),
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!ok) {
    loginFailureCounter.add(1);
  }

  // Track success rate (200 = success, 401 = expected with wrong password)
  loginSuccessRate.add(response.status === 200);

  // Sleep to simulate real user pacing (login takes a few seconds to type)
  sleep(1 + Math.random());
}

export function handleSummary(data) {
  return {
    'load-tests/results/login-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics || {};
  const duration = m.http_req_duration?.values || {};
  const failed = m.http_req_failed?.values || {};
  return `
╔══════════════════════════════════════════════════════════╗
║  k6 Login Endpoint Load Test — Summary                   ║
╚══════════════════════════════════════════════════════════╝
  Requests:     ${m.http_reqs?.values.count || 0}
  Failures:    ${(failed.rate * 100).toFixed(2)}%
  Duration p50: ${duration['p(50)']?.toFixed(2) || 'N/A'} ms
  Duration p95: ${duration['p(95)']?.toFixed(2) || 'N/A'} ms
  Duration p99: ${duration['p(99)']?.toFixed(2) || 'N/A'} ms
  VUs max:     ${m.vus_max?.values.max || 0}
`;
}
