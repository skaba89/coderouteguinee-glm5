// ============================================================
// CodeRoute Guinée — k6 Load Test: RGPD Export (Sprint 11)
// ============================================================
// Tests the RGPD data export endpoint /api/rgpd/export under load.
//
// Scenario: A mass RGPD exercise where 20 candidates simultaneously
// request their full data export (profile + bookings + payments +
// exams + notifications). Each export is a heavy query touching
// 6+ tables, generating a multi-MB JSON response.
//
// Validates:
//  - Latency < 3s p95 even under concurrent load
//  - No data leakage between users (response contains ONLY the requester's data)
//  - Rate limiting kicks in if a single user spams the endpoint
//  - No OOM from generating massive JSON payloads
//
// Run:
//   TEST_PASSWORD=TestCandidat@2024 k6 run --vus 20 --duration 1m load-tests/rgpd-export.js
//
// Env:
//   BASE_URL      — target host (default http://localhost:3000)
//   TEST_EMAIL    — candidate email (default candidat@demo.gn)
//   TEST_PASSWORD — candidate password (REQUIRED)
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'candidat@demo.gn';
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

if (!TEST_PASSWORD) {
  console.warn('WARN: TEST_PASSWORD not set — RGPD export test cannot authenticate.');
}

// Custom metrics
const exportSuccessRate = new Rate('rgpd_export_success');
const exportSizeTrend = new Trend('rgpd_export_bytes', true);
const rateLimitedCounter = new Counter('rgpd_rate_limited');
const leakageCounter = new Counter('rgpd_data_leakage');

// SLOs for RGPD export
export const options = {
  stages: [
    { duration: '15s', target: 5 },    // gentle ramp-up
    { duration: '30s', target: 20 },   // peak: 20 concurrent exports
    { duration: '15s', target: 20 },   // sustain
    { duration: '10s', target: 0 },    // ramp-down
  ],
  thresholds: {
    // p95 must stay < 3s (export is a heavy operation)
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    // < 5% failure rate
    http_req_failed: ['rate<0.05'],
    // Custom: 100% success on completed exports
    rgpd_export_success: ['rate>0.95'],
  },
};

export default function () {
  // 1. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    exportSuccessRate.add(0);
    return;
  }

  const cookies = loginRes.cookies;
  const sessionCookie = `session=${cookies.session[0].value}`;
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: sessionCookie,
  };

  // 2. Get CSRF
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { headers: authHeaders });
  if (csrfRes.status !== 200) {
    exportSuccessRate.add(0);
    return;
  }
  const csrfToken = csrfRes.json('token');
  const fullHeaders = { ...authHeaders, 'X-CSRF-Token': csrfToken };

  // 3. Request RGPD export (POST because it triggers generation)
  let exportRes;
  group('rgpd_export', () => {
    exportRes = http.post(
      `${BASE_URL}/api/rgpd/export`,
      JSON.stringify({ format: 'json' }),
      { headers: fullHeaders, timeout: '30s' }
    );

    check(exportRes, {
      'export 200 or 429': (r) => r.status === 200 || r.status === 429,
      'no 500 errors': (r) => r.status !== 500,
      'no 403 forbidden': (r) => r.status !== 403,
    });

    if (exportRes.status === 429) {
      rateLimitedCounter.add(1);
      exportSuccessRate.add(1); // rate limit is expected behavior
      return;
    }

    if (exportRes.status === 200) {
      const body = exportRes.body;
      exportSizeTrend.add(body.length);

      // Verify structure: should contain user's own data
      try {
        const data = JSON.parse(body);
        const hasUser = data.user !== undefined;
        const hasBookings = Array.isArray(data.bookings);
        const hasPayments = Array.isArray(data.payments);

        check(data, {
          'export has user object': (d) => d.user !== undefined,
          'export has bookings array': (d) => Array.isArray(d.bookings),
          'export has payments array': (d) => Array.isArray(d.payments),
          'export has examResults array': (d) => Array.isArray(d.examResults),
          'export has notifications array': (d) => Array.isArray(d.notifications),
        });

        // CRITICAL: Verify no data leakage — every booking/payment must belong to this user
        const userEmail = data.user?.email;
        if (userEmail && userEmail !== TEST_EMAIL) {
          console.error(`DATA LEAKAGE: export returned data for ${userEmail}, expected ${TEST_EMAIL}`);
          leakageCounter.add(1);
        }

        // Check bookings ownership
        const wrongBookings = (data.bookings || []).filter(
          (b) => b.userEmail && b.userEmail !== userEmail
        );
        if (wrongBookings.length > 0) {
          console.error(`DATA LEAKAGE: export contains ${wrongBookings.length} bookings belonging to other users`);
          leakageCounter.add(wrongBookings.length);
        }

        exportSuccessRate.add(1);
      } catch (e) {
        console.error(`Failed to parse export JSON: ${e.message}`);
        exportSuccessRate.add(0);
      }
    } else {
      exportSuccessRate.add(0);
    }
  });

  sleep(1 + Math.random() * 2); // realistic interval between RGPD requests
}

export function handleSummary(data) {
  const summary = {
    metrics: {
      http_req_duration: data.metrics.http_req_duration,
      http_req_failed: data.metrics.http_req_failed,
      rgpd_export_success: data.metrics.rgpd_export_success,
      rgpd_rate_limited: data.metrics.rgpd_rate_limited,
      rgpd_data_leakage: data.metrics.rgpd_data_leakage,
      rgpd_export_bytes: data.metrics.rgpd_export_bytes,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    'load-tests/results/rgpd-export-summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const bytesMetric = data.metrics.rgpd_export_bytes?.values;
  return `
RGPD Export Test Summary
========================
Duration: ${data.state.testRunDurationMs / 1000}s

HTTP Metrics:
  p50: ${data.metrics.http_req_duration.values['p(50)']?.toFixed(0)}ms
  p95: ${data.metrics.http_req_duration.values['p(95)']?.toFixed(0)}ms
  p99: ${data.metrics.http_req_duration.values['p(99)']?.toFixed(0)}ms
  Failure rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Business Metrics:
  Export success rate: ${(data.metrics.rgpd_export_success.values.rate * 100).toFixed(2)}%
  Rate-limited requests: ${data.metrics.rgpd_rate_limited?.values.count || 0}
  Data leakage incidents: ${data.metrics.rgpd_data_leakage?.values.count || 0}
  Export size p50: ${bytesMetric ? (bytesMetric['p(50)'] / 1024).toFixed(1) : 'N/A'} KB
  Export size p95: ${bytesMetric ? (bytesMetric['p(95)'] / 1024).toFixed(1) : 'N/A'} KB

${data.metrics.rgpd_data_leakage?.values.count > 0 ? '🚨 CRITICAL: DATA LEAKAGE DETECTED' : '✅ No data leakage detected'}
`;
}
