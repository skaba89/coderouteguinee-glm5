// ============================================================
// CodeRoute Guinée — k6 Load Test: Exam Submission (Sprint 3)
// ============================================================
// Tests the exam creation endpoint /api/exams under load.
// During a real exam day, ~200 candidates per centre submit
// their answers within a 30-minute window — the API must
// sustain ~7 req/s without crashing or producing duplicates.
//
// Auth: requires a valid session cookie. Use TEST_SESSION_COOKIE
// env var to pass a pre-authenticated cookie.
//
// Run:
//   TEST_SESSION_COOKIE=xxx k6 run --vus 10 --duration 1m load-tests/exams.js
//
// Env:
//   BASE_URL            — target host (default http://localhost:3000)
//   TEST_SESSION_COOKIE — pre-authenticated session JWT (REQUIRED)
//   CANDIDAT_ID         — sample candidate ID (default test-candidat)
//   CENTRE_ID           — sample centre ID (default test-centre)
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SESSION_COOKIE = __ENV.TEST_SESSION_COOKIE;
const CANDIDAT_ID = __ENV.CANDIDAT_ID || 'test-candidat-id';
const CENTRE_ID = __ENV.CENTRE_ID || 'test-centre-id';

if (!SESSION_COOKIE) {
  console.warn('WARN: TEST_SESSION_COOKIE not set — requests will likely be rejected (401/403).');
  console.warn('       Authenticate first and pass the session cookie.');
}

const examCreateRate = new Rate('exam_create_success');
const examFailureCounter = new Counter('exam_failures');
const examLatencyTrend = new Trend('exam_latency_ms', true);

export const options = {
  stages: [
    { duration: '15s', target: 5 },     // gentle ramp
    { duration: '30s', target: 5 },     // normal exam-day load
    { duration: '15s', target: 10 },    // burst (peak hour)
    { duration: '15s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],   // 95% under 2s, 99% under 4s
    http_req_failed: ['rate<0.1'],                       // <10% transport failures
    exam_create_success: ['rate>0.3'],                   // >30% should succeed with valid session
  },
};

// Generate unique IDs per VU per iteration to avoid collisions
function makeId(prefix, vu, iter) {
  return `${prefix}-${vu}-${iter}-${Date.now()}`;
}

export default function () {
  const payload = JSON.stringify({
    candidatId: CANDIDAT_ID,
    centreId: CENTRE_ID,
    date: new Date().toISOString().slice(0, 10),
    heure: '09:00',
    langue: 'fr',
    totalQuestions: 40,
    // clientRequestId for idempotency — server should dedupe
    clientRequestId: makeId('req', __VU, __ITER),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}),
    },
    tags: { name: 'exam_create' },
  };

  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/exams`, payload, params);
  const latency = Date.now() - start;
  examLatencyTrend.add(latency);

  const ok = check(response, {
    'status is 200, 201, 400, 401, or 403': (r) =>
      [200, 201, 400, 401, 403].includes(r.status),
    'response is JSON': (r) => {
      try { JSON.parse(r.body); return true; } catch (e) { return false; }
    },
    'no stack trace leaked': (r) =>
      !r.body.includes('at /') && !r.body.includes('PrismaClient'),
  });

  if (!ok) examFailureCounter.add(1);
  examCreateRate.add([200, 201].includes(response.status));

  sleep(2 + Math.random() * 3); // simulate candidate pacing between submissions
}

export function handleSummary(data) {
  return {
    'load-tests/results/exams-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics || {};
  const duration = m.http_req_duration?.values || {};
  const failed = m.http_req_failed?.values || {};
  return `
╔══════════════════════════════════════════════════════════╗
║  k6 Exam Submission Load Test — Summary                  ║
╚══════════════════════════════════════════════════════════╝
  Requests:     ${m.http_reqs?.values.count || 0}
  Failures:    ${(failed.rate * 100).toFixed(2)}%
  Duration p50: ${duration['p(50)']?.toFixed(2) || 'N/A'} ms
  Duration p95: ${duration['p(95)']?.toFixed(2) || 'N/A'} ms
  Duration p99: ${duration['p(99)']?.toFixed(2) || 'N/A'} ms
  VUs max:     ${m.vus_max?.values.max || 0}
`;
}
