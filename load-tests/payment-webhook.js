// ============================================================
// CodeRoute Guinée — k6 Load Test: Payment Webhook (Sprint 3)
// ============================================================
// Tests the /api/payments/webhook endpoint under load.
// Payment providers (Orange Money, MTN MoMo) send batches of
// webhook events during peak hours — the endpoint MUST:
//   1. Verify HMAC signature for every request (no bypass under load)
//   2. Process idempotently (no double-booking on retry)
//   3. Return 200 within 2s (provider will retry on timeout)
//
// Run:
//   WEBHOOK_SECRET=xxx k6 run --vus 30 --duration 1m load-tests/payment-webhook.js
//
// Env:
//   BASE_URL        — target host (default http://localhost:3000)
//   WEBHOOK_SECRET  — HMAC secret (REQUIRED for valid signature test)
// ============================================================

import http from 'k6/http';
import crypto from 'k6/crypto';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET || 'test-webhook-secret-32-chars-minimum-padding';

const webhookValidRate = new Rate('webhook_valid_accepted');
const webhookInvalidRejectedRate = new Rate('webhook_invalid_rejected');
const webhookLatencyTrend = new Trend('webhook_latency_ms', true);
const webhookFailures = new Counter('webhook_failures');

export const options = {
  scenarios: {
    // Scenario 1: valid signed webhooks
    valid_webhooks: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'validWebhook',
    },
    // Scenario 2: invalid signature (attack simulation)
    invalid_webhooks: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '40s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'invalidWebhook',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% under 2s
    http_req_failed: ['rate<0.05'],       // <5% transport failures
    webhook_invalid_rejected: ['rate>0.99'], // 99%+ invalid requests must be rejected
  },
};

function signBody(body, secret) {
  // k6/crypto supports HMAC-SHA256 directly
  return crypto.hmac('sha256', secret, body, 'hex');
}

function makeWebhookPayload(vu, iter) {
  return JSON.stringify({
    transaction_id: `k6-tx-${vu}-${iter}-${Date.now()}`,
    status: 'success',
    amount: 35000,
    currency: 'GNF',
    customer_msisdn: '+224620000000',
    description: 'Examen code de la route',
    timestamp: new Date().toISOString(),
  });
}

// Scenario 1: send validly-signed webhooks
export function validWebhook() {
  const body = makeWebhookPayload(__VU, __ITER);
  const signature = signBody(body, WEBHOOK_SECRET);

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Orange-Signature': signature,
      'X-Provider': 'orange_money',
    },
    tags: { name: 'webhook_valid' },
  };

  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/payments/webhook`, body, params);
  webhookLatencyTrend.add(Date.now() - start);

  const ok = check(response, {
    'status is 200, 202, or 404': (r) => [200, 202, 404].includes(r.status),
    'response time < 2s': (r) => r.timings.duration < 2000,
    'no stack trace leaked': (r) => !r.body.includes('at /') && !r.body.includes('.ts:'),
  });

  // 404 is acceptable (transaction not found in test DB)
  webhookValidRate.add([200, 202].includes(response.status));
  if (!ok) webhookFailures.add(1);

  sleep(0.5 + Math.random());
}

// Scenario 2: send invalid-signature webhooks (must be rejected)
export function invalidWebhook() {
  const body = makeWebhookPayload(__VU, __ITER);
  // Wrong signature — random hex string
  const fakeSignature = 'a'.repeat(64);

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Orange-Signature': fakeSignature,
      'X-Provider': 'orange_money',
    },
    tags: { name: 'webhook_invalid' },
  };

  const start = Date.now();
  const response = http.post(`${BASE_URL}/api/payments/webhook`, body, params);
  webhookLatencyTrend.add(Date.now() - start);

  const rejected = check(response, {
    'status is 400, 401, or 403': (r) => [400, 401, 403].includes(r.status),
    'response time < 500ms': (r) => r.timings.duration < 500, // must reject fast
  });

  webhookInvalidRejectedRate.add(rejected);
  if (!rejected) webhookFailures.add(1);

  sleep(0.1 + Math.random() * 0.3);
}

export function handleSummary(data) {
  return {
    'load-tests/results/payment-webhook-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics || {};
  const duration = m.http_req_duration?.values || {};
  const failed = m.http_req_failed?.values || {};
  return `
╔══════════════════════════════════════════════════════════╗
║  k6 Payment Webhook Load Test — Summary                  ║
╚══════════════════════════════════════════════════════════╝
  Requests:                  ${m.http_reqs?.values.count || 0}
  Transport failures:       ${(failed.rate * 100).toFixed(2)}%
  Duration p50:              ${duration['p(50)']?.toFixed(2) || 'N/A'} ms
  Duration p95:              ${duration['p(95)']?.toFixed(2) || 'N/A'} ms
  Duration p99:              ${duration['p(99)']?.toFixed(2) || 'N/A'} ms
  Invalid webhooks rejected: ${((m.webhook_invalid_rejected?.values.rate || 0) * 100).toFixed(2)}%
  VUs max:                  ${m.vus_max?.values.max || 0}
`;
}
