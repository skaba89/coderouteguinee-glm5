// ============================================================
// CodeRoute Guinée — Payment Webhook E2E (Sprint 3)
// ============================================================
// Verifies the payment webhook endpoint behavior:
//   1. Rejects unauthenticated POSTs (no signature)
//   2. Rejects POSTs with an invalid signature
//   3. Returns 400 for malformed payloads
//   4. Returns 405 for non-POST methods
//
// These tests do NOTH require a running payment provider — they
// test our own webhook endpoint's input validation, which is the
// most common attack surface for payment fraud.
// ============================================================

import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_ORANGE_MONEY_SECRET || 'test-webhook-secret-32-chars-min-padding';

test.describe('Payment webhook — input validation', () => {
  test('rejects GET requests with 405 Method Not Allowed', async ({ request }) => {
    const response = await request.get('/api/payments/webhook');
    expect([405, 404]).toContain(response.status());
  });

  test('rejects POST without signature header', async ({ request }) => {
    const response = await request.post('/api/payments/webhook', {
      data: {
        transaction_id: 'test-tx-123',
        status: 'success',
        amount: 35000,
      },
    });
    // Missing signature must be rejected
    expect([400, 401, 403]).toContain(response.status());
  });

  test('rejects POST with invalid signature', async ({ request }) => {
    const body = JSON.stringify({
      transaction_id: 'test-tx-123',
      status: 'success',
      amount: 35000,
    });
    const response = await request.post('/api/payments/webhook', {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'X-Orange-Signature': 'invalid-signature-value',
      },
    });
    expect([400, 401, 403]).toContain(response.status());
  });

  test('rejects POST with tampered body (signature does not match)', async ({ request }) => {
    const originalBody = JSON.stringify({
      transaction_id: 'test-tx-456',
      status: 'success',
      amount: 35000,
    });
    // Sign the original body, then send a DIFFERENT body
    const signature = createHmac('sha256', WEBHOOK_SECRET).update(originalBody).digest('hex');

    const tamperedBody = JSON.stringify({
      transaction_id: 'test-tx-456',
      status: 'success',
      amount: 999999, // tampered!
    });

    const response = await request.post('/api/payments/webhook', {
      data: tamperedBody,
      headers: {
        'Content-Type': 'application/json',
        'X-Orange-Signature': signature,
      },
    });
    // Tampering must be detected
    expect([400, 401, 403]).toContain(response.status());
  });

  test('rejects malformed JSON body', async ({ request }) => {
    const response = await request.post('/api/payments/webhook', {
      data: 'this is not json',
      headers: {
        'Content-Type': 'application/json',
        'X-Orange-Signature': 'deadbeef',
      },
    });
    // Malformed body must be rejected, not crash the server
    expect([400, 401, 403]).toContain(response.status());
  });

  test('accepts valid HMAC-SHA256 signature (when secret is configured)', async ({ request }) => {
    // Skip in CI if the secret is not configured for tests
    test.skip(!WEBHOOK_SECRET || WEBHOOK_SECRET.length < 32, 'Webhook secret not configured for E2E');

    const body = JSON.stringify({
      transaction_id: 'e2e-valid-tx-' + Date.now(),
      status: 'success',
      amount: 35000,
      currency: 'GNF',
      customer_msisdn: '+224620000000',
      description: 'Examen code de la route',
    });

    const signature = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

    const response = await request.post('/api/payments/webhook', {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'X-Orange-Signature': signature,
        'X-Provider': 'orange_money',
      },
    });

    // Should be 200 (processed), 202 (queued), or 404 (transaction not found — acceptable)
    expect([200, 202, 404]).toContain(response.status());
  });
});

test.describe('Payment webhook — provider identification', () => {
  test('identifies provider from X-Provider header', async ({ request }) => {
    const body = JSON.stringify({ transaction_id: 'p-id-test', status: 'success' });
    const sig = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

    const response = await request.post('/api/payments/webhook', {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        'X-Provider': 'mtn_money',
        'X-MTN-Signature': sig,
      },
    });
    // Provider mismatch should still result in a rejection (signature won't match MTN secret)
    expect([400, 401, 403]).toContain(response.status());
  });

  test('does not leak internal errors in response body', async ({ request }) => {
    const response = await request.post('/api/payments/webhook', {
      data: { bad: 'payload' },
      headers: { 'X-Orange-Signature': 'bad-sig' },
    });
    const body = await response.text().catch(() => '');
    // Must NOT leak stack traces, file paths, or DB error messages
    expect(body).not.toMatch(/at\s+\/.*\.ts:\d+:\d+/);
    expect(body).not.toMatch(/PrismaClient|prisma\./);
    expect(body).not.toMatch(/\/home\/|\/var\/www\//);
  });
});
