# CodeRoute Guinée — Load Tests (k6)

This directory contains [k6](https://k6.io/) load testing scripts that verify the CodeRoute Guinée backend can sustain realistic production traffic.

## Scenarios

| Script | Endpoint | VUs | Duration | What it tests |
|---|---|---|---|---|
| `health.js` | `GET /api/health?quick=true` | 50→100 | 80s | Liveness probe under load (k8s + UptimeRobot pattern) |
| `login.js` | `POST /api/auth/login` | 20→50 | 75s | Auth under credential-stuffing attack (argon2 hashing + rate limit) |
| `exams.js` | `POST /api/exams` | 5→10 | 75s | Exam submission during peak exam-day (200 candidates/centre/30min) |
| `payment-webhook.js` | `POST /api/payments/webhook` | 30 (two scenarios) | 60s | Webhook HMAC verification under burst load (Orange Money / MTN MoMo) |
| `booking-flow.js` | `POST /api/bookings` + flow | 50 | 2min | Concurrent booking during DNTT slot opening (no double-booking, pricing integrity) |
| `rgpd-export.js` | `POST /api/rgpd/export` | 20 | 1min | Concurrent RGPD exports with data leakage detection |
| `webhook-storm.js` | `POST /api/payments/webhook` | 270 (3 scenarios) | 90s | Webhook storm: 200 legit + 50 invalid sig + 20 replay (idempotency, signature verify) |
| `admin-concurrent.js` | `GET /api/admin/stats` + flow | 30 (4 roles) | 90s | 30 admins across 4 roles concurrent dashboard (no DB pool exhaustion, no audit log loss) |

## Prerequisites

### 1. Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo apt install k6

# Or via Docker (no install)
docker run --rm -i grafana/k6 run - < load-tests/health.js
```

### 2. Start the dev server

```bash
npm run dev
```

Verify it's reachable:
```bash
curl http://localhost:3000/api/health?quick=true
# {"status":"alive","uptime":...}
```

### 3. Set required environment variables

| Variable | Required for | How to get it |
|---|---|---|
| `BASE_URL` | All | Default: `http://localhost:3000` |
| `TEST_EMAIL` | login.js | Default: `candidat@demo.gn` |
| `TEST_PASSWORD` | login.js | Same as `SEED_CANDIDAT_PASSWORD` in `.env.test` |
| `TEST_SESSION_COOKIE` | exams.js | Login manually, copy `session=...` from browser devtools |
| `WEBHOOK_SECRET` | payment-webhook.js | Same as `WEBHOOK_ORANGE_MONEY_SECRET` in `.env` |

## Running tests

### Run a single scenario

```bash
# Health endpoint (no env vars needed)
k6 run --vus 50 --duration 30s load-tests/health.js

# Login (needs TEST_PASSWORD)
TEST_PASSWORD=TestCandidat@2024 k6 run --vus 20 --duration 1m load-tests/login.js

# Exam submission (needs TEST_SESSION_COOKIE)
TEST_SESSION_COOKIE="session=eyJhbGc..." k6 run --vus 10 --duration 1m load-tests/exams.js

# Payment webhook (needs WEBHOOK_SECRET)
WEBHOOK_SECRET="your-32-char-secret" k6 run load-tests/payment-webhook.js
```

### Run all scenarios

```bash
# Full suite — requires all env vars
TEST_PASSWORD=xxx \
TEST_SESSION_COOKIE="session=xxx" \
WEBHOOK_SECRET=xxx \
bash load-tests/run-all.sh

# Smoke mode — low VUs, short duration, only health + webhook with secret
bash load-tests/run-all.sh --smoke
```

### Use Docker (no local k6 install)

```bash
docker run --rm --network host -i \
  -e BASE_URL=http://host.docker.internal:3000 \
  grafana/k6 run - < load-tests/health.js
```

## Thresholds (SLOs)

Each script enforces strict Service Level Objectives via k6 `thresholds`:

| Endpoint | p50 | p95 | p99 | Failure rate |
|---|---|---|---|---|
| `/api/health?quick=true` | <50ms | <200ms | <500ms | <0.1% |
| `/api/auth/login` | <500ms | <1500ms | <3000ms | <5% |
| `/api/exams` | <500ms | <2000ms | <4000ms | <10% |
| `/api/payments/webhook` (valid) | <500ms | <2000ms | — | <5% |
| `/api/payments/webhook` (invalid) | <100ms | <500ms | — | — |

If any threshold is breached, k6 exits with non-zero — useful for CI gates.

## Realistic load profiles

The VU counts are calibrated to **real CodeRoute Guinée traffic**:

- **Health check**: UptimeRobot polls every 30s, plus k8s liveness every 10s = ~6 req/min baseline. We test 50-100 VUs (worst case: monitoring storm).
- **Login**: DNTT peak hours see ~5-10 login attempts/s. We test 20-50 VUs (credential stuffing simulation).
- **Exam submission**: A 30-place centre with 200 candidates/day, exam window 30 minutes = ~7 submissions/min sustained. We test 10 VUs (peak burst).
- **Payment webhook**: Orange Money batches webhook retries during 09:00-11:00 peak. We test 30 VUs (peak batch).

## Results

Each run writes JSON summary to `load-tests/results/<scenario>-summary.json`:

```json
{
  "metrics": {
    "http_req_duration": { "values": { "p(95)": 142.3, "p(99)": 287.5 } },
    "http_req_failed": { "values": { "rate": 0.001 } }
  }
}
```

Use these for trending in Grafana or for CI pass/fail gates.

## CI Integration (GitHub Actions)

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on: { pull_request: { branches: [main] } }
jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/health.js
          flags: --vus 20 --duration 30s
```

## Troubleshooting

### "TEST_PASSWORD not set" warning

The login script refuses to send real credentials without `TEST_PASSWORD`. Set it from `.env.test`:

```bash
export TEST_PASSWORD=$(grep SEED_CANDIDAT_PASSWORD .env.test | cut -d= -f2 | tr -d '"')
```

### Webhook test fails with "403 Forbidden"

The webhook endpoint fails-closed when no `WEBHOOK_ORANGE_MONEY_SECRET` is configured in the server. Set it in `.env`:

```bash
echo "WEBHOOK_ORANGE_MONEY_SECRET=$(openssl rand -hex 32)" >> .env
npm run dev  # restart
```

### k6 reports "connection refused"

The dev server isn't running or is on a different port. Check:
```bash
curl http://localhost:3000/api/health?quick=true
```

If port differs, pass `BASE_URL`:
```bash
BASE_URL=http://localhost:3001 k6 run load-tests/health.js
```
