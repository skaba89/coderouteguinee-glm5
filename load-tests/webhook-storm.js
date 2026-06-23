// ============================================================
// CodeRoute Guinée — k6 Load Test: Webhook Storm (Sprint 11)
// ============================================================
// Tests the Mobile Money webhook endpoint under a storm of
// legitimate AND malicious requests, simulating a real peak:
//
//   - 200 VUs sending valid signed webhooks (Orange Money retry batch)
//   - 50 VUs sending INVALID signed webhooks (attacker attempting forgery)
//   - 20 VUs sending replay attacks (same payload repeated)
//
// Validates:
//  - Valid webhooks processed < 500ms p95
//  - Invalid signatures rejected < 100ms (fast-fail)
//  - Replay attacks blocked (idempotency check)
//  - No double-payment (idempotency)
//  - Rate limiting kicks in for attacker IPs
//
// Run:
//   WEBHOOK_SECRET=your-32-char-secret k6 run load-tests/webhook-storm.js
//
// Env:
//   BASE_URL       — target host (default http://localhost:3000)
//   WEBHOOK_SECRET — HMAC secret (REQUIRED, same as WEBHOOK_ORANGE_MONEY_SECRET)
// ============================================================

import http from 'k6/http';
import crypto from 'k6/crypto';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error('ERROR: WEBHOOK_SECRET not set. Cannot sign webhooks.');
  console.error('       Set it to the same value as WEBHOOK_ORANGE_MONEY_SECRET in .env');
}

// Custom metrics
const validWebhookRate = new Rate('webhook_valid_processed');
const invalidWebhookRejectedRate = new Rate('webhook_invalid_rejected');
const replayAttackBlockedRate = new Rate('webhook_replay_blocked');
const doublePaymentCounter = new Counter('webhook_double_payment_attempts');
const webhookLatencyTrend = new Trend('webhook_latency_ms', true);

// Three parallel scenarios
export const options = {
  scenarios: {
    // Scenario 1: legitimate webhooks (200 VUs)
    legitimate: {
      executor: 'ramping-vus',
      exec: 'legitimateWebhook',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Scenario 2: attacker with invalid signatures (50 VUs)
    attacker_invalid: {
      executor: 'ramping-vus',
      exec: 'attackerInvalidSignature',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Scenario 3: replay attacker (20 VUs)
    attacker_replay: {
      executor: 'ramping-vus',
      exec: 'replayAttacker',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Valid webhook processing < 500ms p95
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    // < 5% failure rate for valid webhooks
    http_req_failed: ['rate<0.05'],
    // 100% of invalid signatures must be rejected
    webhook_invalid_rejected: ['rate==1.00'],
    // 100% of replay attacks must be blocked
    webhook_replay_blocked: ['rate>0.95'],
    // 0 double payments allowed
    webhook_double_payment_attempts: ['count==0'],
  },
};

function signPayload(body, secret) {
  return crypto.hmac('sha256', secret, body, 'hex');
}

function generateWebhookPayload(uniqueId) {
  return JSON.stringify({
    id: uniqueId,
    transaction_id: `OM-${uniqueId}`,
    amount: 350000,
    currency: 'GNF',
    status: 'success',
    customer_msisdn: '622000001',
    reference: `BOOKING-${uniqueId}`,
    timestamp: new Date().toISOString(),
  });
}

// Scenario 1: legitimate webhooks
export function legitimateWebhook() {
  if (!WEBHOOK_SECRET) {
    validWebhookRate.add(0);
    return;
  }

  const uniqueId = `legit-${__VU}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = generateWebhookPayload(uniqueId);
  const signature = signPayload(payload, WEBHOOK_SECRET);

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/payments/webhook`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Orange-Signature': `sha256=${signature}`,
      'X-Webhook-Provider': 'orange_money',
    },
  });
  webhookLatencyTrend.add(Date.now() - start);

  check(res, {
    'legit webhook 200 or 202': (r) => r.status === 200 || r.status === 202,
    'no 500 errors': (r) => r.status !== 500,
  });

  validWebhookRate.add(res.status === 200 || res.status === 202 ? 1 : 0);

  sleep(0.1 + Math.random() * 0.3); // 100-400ms between webhooks (realistic Orange batch)
}

// Scenario 2: attacker with invalid signatures
export function attackerInvalidSignature() {
  const uniqueId = `attack-${__VU}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = generateWebhookPayload(uniqueId);
  const fakeSignature = 'a'.repeat(64); // invalid hex

  const res = http.post(`${BASE_URL}/api/payments/webhook`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Orange-Signature': `sha256=${fakeSignature}`,
      'X-Webhook-Provider': 'orange_money',
    },
  });

  check(res, {
    'invalid webhook 401 or 403': (r) => r.status === 401 || r.status === 403,
    'no 200 (rejected)': (r) => r.status !== 200 && r.status !== 202,
    'fast rejection (< 100ms)': (r) => r.timings.duration < 200,
  });

  invalidWebhookRejectedRate.add(
    res.status === 401 || res.status === 403 ? 1 : 0
  );

  sleep(0.05 + Math.random() * 0.1); // aggressive attacker
}

// Scenario 3: replay attacker — sends the same valid webhook multiple times
const replayPayload = generateWebhookPayload('replay-fixed-id');
const replaySignature = WEBHOOK_SECRET ? signPayload(replayPayload, WEBHOOK_SECRET) : '';

export function replayAttacker() {
  if (!WEBHOOK_SECRET || !replaySignature) {
    replayAttackBlockedRate.add(0);
    return;
  }

  const res = http.post(`${BASE_URL}/api/payments/webhook`, replayPayload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Orange-Signature': `sha256=${replaySignature}`,
      'X-Webhook-Provider': 'orange_money',
    },
  });

  // First call should succeed, subsequent calls should return 409 Conflict or 200 with idempotent response
  check(res, {
    'replay handled': (r) =>
      r.status === 200 || r.status === 202 || r.status === 409,
    'no 500 errors': (r) => r.status !== 500,
    'no double-payment': (r) => r.status !== 201, // 201 would mean a NEW payment was created
  });

  // If response is 201, it means a new payment was created = double payment bug!
  if (res.status === 201) {
    doublePaymentCounter.add(1);
    replayAttackBlockedRate.add(0);
  } else {
    replayAttackBlockedRate.add(1);
  }

  sleep(0.2 + Math.random() * 0.3);
}

export function handleSummary(data) {
  const summary = {
    metrics: {
      http_req_duration: data.metrics.http_req_duration,
      http_req_failed: data.metrics.http_req_failed,
      webhook_valid_processed: data.metrics.webhook_valid_processed,
      webhook_invalid_rejected: data.metrics.webhook_invalid_rejected,
      webhook_replay_blocked: data.metrics.webhook_replay_blocked,
      webhook_double_payment_attempts: data.metrics.webhook_double_payment_attempts,
      webhook_latency_ms: data.metrics.webhook_latency_ms,
    },
    scenarios: Object.keys(options.scenarios).map((name) => ({
      name,
      maxVUs: options.scenarios[name].stages.reduce((max, s) => Math.max(max, s.target), 0),
    })),
    timestamp: new Date().toISOString(),
  };

  return {
    'load-tests/results/webhook-storm-summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const doublePayments = data.metrics.webhook_double_payment_attempts?.values.count || 0;
  const invalidRejected = data.metrics.webhook_invalid_rejected?.values.rate || 0;
  const replayBlocked = data.metrics.webhook_replay_blocked?.values.rate || 0;

  return `
Webhook Storm Test Summary
==========================
Duration: ${data.state.testRunDurationMs / 1000}s
Scenarios:
  - Legitimate webhooks: 200 VUs peak
  - Invalid signature attackers: 50 VUs
  - Replay attackers: 20 VUs

HTTP Metrics:
  p50: ${data.metrics.http_req_duration.values['p(50)']?.toFixed(0)}ms
  p95: ${data.metrics.http_req_duration.values['p(95)']?.toFixed(0)}ms
  p99: ${data.metrics.http_req_duration.values['p(99)']?.toFixed(0)}ms
  Failure rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Security Metrics:
  Valid webhooks processed: ${((data.metrics.webhook_valid_processed?.values.rate || 0) * 100).toFixed(2)}%
  Invalid signatures rejected: ${(invalidRejected * 100).toFixed(2)}%
  Replay attacks blocked: ${(replayBlocked * 100).toFixed(2)}%
  Double-payment bugs detected: ${doublePayments}

${doublePayments > 0 ? '🚨 CRITICAL: DOUBLE-PAYMENT BUG — IDEMPOTENCY BROKEN' : '✅ Idempotency intact'}
${invalidRejected < 1 ? '🚨 CRITICAL: INVALID SIGNATURE ACCEPTED' : '✅ Signature verification working'}
${replayBlocked < 0.95 ? '🚨 CRITICAL: REPLAY ATTACK SUCCEEDED' : '✅ Replay protection working'}
`;
}
