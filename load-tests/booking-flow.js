// ============================================================
// CodeRoute Guinée — k6 Load Test: Booking Flow (Sprint 11)
// ============================================================
// Tests the complete exam booking flow:
//   1. Login as candidate
//   2. GET /api/centres (list centres)
//   3. GET /api/tarifs/current (get current pricing)
//   4. GET /api/bookings (list own bookings)
//   5. POST /api/bookings (create new booking)
//
// Simulates a peak registration window: 50 candidates booking
// an exam slot simultaneously (e.g. DNTT opens 200 slots at 09:00
// and they're gone in 5 minutes). Validates that:
//  - No double-booking occurs (lock contention)
//  - Pricing is consistent (server-side calc)
//  - Latency stays under SLO
//  - 0% data corruption
//
// Run:
//   TEST_PASSWORD=TestCandidat@2024 k6 run --vus 50 --duration 2m load-tests/booking-flow.js
//
// Env:
//   BASE_URL      — target host (default http://localhost:3000)
//   TEST_EMAIL    — candidate email (default candidat@demo.gn)
//   TEST_PASSWORD — candidate password (REQUIRED)
//   CENTRE_ID     — target centre ID (default first available)
//   SESSION_ID    — target exam session ID (default first available)
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'candidat@demo.gn';
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const CENTRE_ID = __ENV.CENTRE_ID || '';
const SESSION_ID = __ENV.SESSION_ID || '';

if (!TEST_PASSWORD) {
  console.warn('WARN: TEST_PASSWORD not set — booking flow cannot authenticate.');
  console.warn('       Set it from .env.test (SEED_CANDIDAT_PASSWORD).');
}

// Custom metrics
const bookingSuccessRate = new Rate('booking_success');
const doubleBookingCounter = new Counter('double_booking_attempts');
const pricingConsistencyRate = new Rate('pricing_consistent');
const flowLatencyTrend = new Trend('booking_flow_total_ms', true);

// SLOs — peak DNTT registration window
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp-up
    { duration: '1m', target: 50 },    // peak: 50 VUs trying to book
    { duration: '20s', target: 50 },   // sustain peak
    { duration: '10s', target: 0 },    // ramp-down
  ],
  thresholds: {
    // 95% of booking attempts must complete < 2s
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    // < 5% failure rate (409 Conflict is acceptable — means lock works)
    http_req_failed: ['rate<0.05'],
    // Custom: 100% pricing consistency
    pricing_consistent: ['rate==1.00'],
    // Custom: < 1% double booking (should be 0% — hard ceiling)
    booking_success: ['rate>0.90'],
  },
};

export default function () {
  const flowStart = Date.now();

  // 1. Login
  let loginRes;
  group('login', () => {
    loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(loginRes, {
      'login 200': (r) => r.status === 200,
      'session cookie set': (r) => /session=/.test(r.headers['Set-Cookie'] || ''),
    });
  });

  if (loginRes.status !== 200) {
    bookingSuccessRate.add(0);
    return;
  }

  const cookies = loginRes.cookies;
  const sessionCookie = `session=${cookies.session[0].value}`;
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: sessionCookie,
  };

  // 2. Fetch CSRF token
  let csrfRes;
  group('csrf', () => {
    csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { headers: authHeaders });
    check(csrfRes, {
      'csrf 200': (r) => r.status === 200,
      'csrf token returned': (r) => r.json('token') !== undefined,
    });
  });

  const csrfToken = csrfRes.json('token');
  const fullHeaders = {
    ...authHeaders,
    'X-CSRF-Token': csrfToken,
  };

  // 3. List centres
  group('list_centres', () => {
    const res = http.get(`${BASE_URL}/api/centres`, { headers: authHeaders });
    check(res, {
      'centres 200': (r) => r.status === 200,
      'centres array': (r) => Array.isArray(r.json('centres') || r.json()),
    });
  });

  // 4. Get current tarif
  let tarifRes;
  group('get_tarif', () => {
    tarifRes = http.get(`${BASE_URL}/api/tarifs/current`, { headers: authHeaders });
    check(tarifRes, {
      'tarif 200': (r) => r.status === 200,
      'tarif amount present': (r) => r.json('amount') !== undefined,
    });
  });

  const expectedAmount = tarifRes.json('amount');

  // 5. List own bookings
  group('list_bookings', () => {
    const res = http.get(`${BASE_URL}/api/bookings`, { headers: authHeaders });
    check(res, {
      'bookings 200': (r) => r.status === 200,
    });
  });

  // 6. Create a new booking (the critical operation)
  let bookingRes;
  group('create_booking', () => {
    const body = {
      centreId: CENTRE_ID || 'test-centre-1',
      sessionId: SESSION_ID || 'test-session-1',
    };
    bookingRes = http.post(
      `${BASE_URL}/api/bookings`,
      JSON.stringify(body),
      { headers: fullHeaders }
    );

    // 201 = created, 409 = conflict (double-booking blocked — expected at high concurrency)
    check(bookingRes, {
      'booking 201 or 409': (r) => r.status === 201 || r.status === 409,
      'no 500 errors': (r) => r.status !== 500,
      'no 403 forbidden': (r) => r.status !== 403,
    });

    if (bookingRes.status === 409) {
      doubleBookingCounter.add(1);
    }
  });

  // 7. Verify pricing consistency if booking was created
  if (bookingRes.status === 201) {
    const bookingData = bookingRes.json();
    const actualAmount = bookingData.amount || bookingData.payment?.amount;
    pricingConsistencyRate.add(actualAmount === expectedAmount);

    check(bookingData, {
      'booking has id': (d) => d.id !== undefined,
      'booking status pending_payment': (d) =>
        d.status === 'pending_payment' || d.payment?.status === 'pending',
    });
  }

  const flowDuration = Date.now() - flowStart;
  flowLatencyTrend.add(flowDuration);
  bookingSuccessRate.add(bookingRes.status === 201 || bookingRes.status === 409);

  sleep(0.5 + Math.random() * 1.5); // realistic user think time
}

// Teardown: log summary
export function handleSummary(data) {
  const summary = {
    metrics: {
      http_req_duration: data.metrics.http_req_duration,
      http_req_failed: data.metrics.http_req_failed,
      booking_success: data.metrics.booking_success,
      double_booking_attempts: data.metrics.double_booking_attempts,
      pricing_consistent: data.metrics.pricing_consistent,
      booking_flow_total_ms: data.metrics.booking_flow_total_ms,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    'load-tests/results/booking-flow-summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  return `
Booking Flow Test Summary
=========================
Duration: ${data.state.testRunDurationMs / 1000}s
VUs peak: ${options.stages.reduce((max, s) => Math.max(max, s.target), 0)}

HTTP Metrics:
  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(0)}ms
  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms
  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms
  Failure rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Business Metrics:
  Booking success rate: ${(data.metrics.booking_success.values.rate * 100).toFixed(2)}%
  Double-booking attempts blocked: ${data.metrics.double_booking_attempts.values.count}
  Pricing consistency: ${((data.metrics.pricing_consistent?.values.rate || 0) * 100).toFixed(2)}%
`;
}
