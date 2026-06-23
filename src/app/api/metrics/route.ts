// ============================================================
// CodeRoute Guinée — Prometheus metrics endpoint (Sprint 12)
// ============================================================
// GET /api/metrics — Prometheus-formatted metrics for scraping.
//
// Exposes:
//   - http_requests_total{method,route,status}        counter
//   - http_request_duration_seconds_bucket{le,route}  histogram
//   - exam_submission_total{status,result}            counter
//   - payment_webhook_total{provider,status}          counter
//   - payment_amount_total{provider}                  counter (GNF)
//   - booking_created_total{centre}                   counter
//   - fraud_alert_total{type}                         counter
//   - active_users_total                              gauge
//   - coderoute_candidates_total                      gauge
//   - coderoute_active_centres{region}                gauge
//   - coderoute_build_info                            gauge
//   - process_resident_memory_bytes                   gauge
//   - process_heap_size_bytes                         gauge
//
// Auth: none (Prometheus scraper must be IP-allowlisted at Nginx level)
// ============================================================

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// In-memory counters (reset on each app restart — for production-grade
// metrics, use prom-client with a metrics registry persisted to Redis)
const metrics = {
  httpRequests: new Map<string, number>(),
  httpDurationBuckets: new Map<string, number[]>(),
  examSubmissions: new Map<string, number>(),
  paymentWebhooks: new Map<string, number>(),
  paymentAmounts: new Map<string, number>(),
  bookings: new Map<string, number>(),
  fraudAlerts: new Map<string, number>(),
}

// Histogram buckets for HTTP latency (in seconds)
const LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]

export async function GET() {
  try {
    const lines: string[] = []

    // ─── HTTP requests counter ─────────────────────────
    lines.push('# HELP http_requests_total Total HTTP requests by method, route, and status')
    lines.push('# TYPE http_requests_total counter')
    for (const [key, value] of metrics.httpRequests) {
      const [method, route, status] = key.split('|')
      lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`)
    }

    // ─── HTTP request duration histogram ───────────────
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds')
    lines.push('# TYPE http_request_duration_seconds histogram')
    for (const [route, buckets] of metrics.httpDurationBuckets) {
      for (let i = 0; i < LATENCY_BUCKETS.length; i++) {
        const le = LATENCY_BUCKETS[i]
        const count = buckets[i] || 0
        lines.push(`http_request_duration_seconds_bucket{route="${route}",le="${le}"} ${count}`)
      }
      lines.push(`http_request_duration_seconds_bucket{route="${route}",le="+Inf"} ${buckets.reduce((a, b) => a + b, 0)}`)
    }

    // ─── Exam submissions ──────────────────────────────
    lines.push('# HELP exam_submission_total Exam submissions by status and result')
    lines.push('# TYPE exam_submission_total counter')
    for (const [key, value] of metrics.examSubmissions) {
      const [status, result] = key.split('|')
      lines.push(`exam_submission_total{status="${status}",result="${result}"} ${value}`)
    }

    // ─── Payment webhooks ──────────────────────────────
    lines.push('# HELP payment_webhook_total Payment webhooks received by provider and status')
    lines.push('# TYPE payment_webhook_total counter')
    for (const [key, value] of metrics.paymentWebhooks) {
      const [provider, status] = key.split('|')
      lines.push(`payment_webhook_total{provider="${provider}",status="${status}"} ${value}`)
    }

    // ─── Payment amounts (revenue) ─────────────────────
    lines.push('# HELP payment_amount_total Total payment amount in GNF by provider')
    lines.push('# TYPE payment_amount_total counter')
    for (const [provider, amount] of metrics.paymentAmounts) {
      lines.push(`payment_amount_total{provider="${provider}"} ${amount}`)
    }

    // ─── Bookings ──────────────────────────────────────
    lines.push('# HELP booking_created_total Bookings created by centre')
    lines.push('# TYPE booking_created_total counter')
    for (const [centre, count] of metrics.bookings) {
      lines.push(`booking_created_total{centre="${centre}"} ${count}`)
    }

    // ─── Fraud alerts ──────────────────────────────────
    lines.push('# HELP fraud_alert_total Fraud alerts by type')
    lines.push('# TYPE fraud_alert_total counter')
    for (const [type, count] of metrics.fraudAlerts) {
      lines.push(`fraud_alert_total{type="${type}"} ${count}`)
    }

    // ─── Database-sourced gauges ───────────────────────
    try {
      const [candidatesCount, centresByRegion, activeUsers24h] = await Promise.all([
        db.user.count({ where: { role: 'candidat', isActive: true } }),
        db.centre.groupBy({
          by: ['region'],
          where: { isActive: true },
          _count: { id: true },
        }),
        db.user.count({
          where: {
            lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ])

      lines.push('# HELP coderoute_candidates_total Total active candidates in database')
      lines.push('# TYPE coderoute_candidates_total gauge')
      lines.push(`coderoute_candidates_total ${candidatesCount}`)

      lines.push('# HELP coderoute_active_centres Active centres by region')
      lines.push('# TYPE coderoute_active_centres gauge')
      for (const c of centresByRegion) {
        lines.push(`coderoute_active_centres{region="${c.region}"} ${c._count.id}`)
      }

      lines.push('# HELP active_users_total Users active in the last 24h')
      lines.push('# TYPE active_users_total gauge')
      lines.push(`active_users_total ${activeUsers24h}`)
    } catch (dbErr) {
      // If DB is unreachable, skip these metrics but keep the endpoint working
      lines.push('# DB-sourced metrics unavailable — see app logs for details')
    }

    // ─── Build info ────────────────────────────────────
    lines.push('# HELP coderoute_build_info Build information')
    lines.push('# TYPE coderoute_build_info gauge')
    lines.push(`coderoute_build_info{version="${process.env.npm_package_version || '0.2.0'}",node="${process.version}"} 1`)

    // ─── Process metrics ───────────────────────────────
    const memUsage = process.memoryUsage()
    lines.push('# HELP process_resident_memory_bytes Resident memory size in bytes')
    lines.push('# TYPE process_resident_memory_bytes gauge')
    lines.push(`process_resident_memory_bytes ${memUsage.rss}`)

    lines.push('# HELP process_heap_size_bytes Process heap size in bytes')
    lines.push('# TYPE process_heap_size_bytes gauge')
    lines.push(`process_heap_size_bytes ${memUsage.heapUsed}`)

    return new NextResponse(lines.join('\n') + '\n', {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to generate metrics', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ─── Helper functions to record metrics (called from API routes) ──

export function recordHttpRequest(method: string, route: string, status: number, durationMs: number) {
  const key = `${method}|${route}|${status}`
  metrics.httpRequests.set(key, (metrics.httpRequests.get(key) || 0) + 1)

  const durationSec = durationMs / 1000
  if (!metrics.httpDurationBuckets.has(route)) {
    metrics.httpDurationBuckets.set(route, new Array(LATENCY_BUCKETS.length).fill(0))
  }
  const buckets = metrics.httpDurationBuckets.get(route)!
  for (let i = 0; i < LATENCY_BUCKETS.length; i++) {
    if (durationSec <= LATENCY_BUCKETS[i]) {
      buckets[i]++
    }
  }
}

export function recordExamSubmission(status: 'success' | 'failed', result: 'pass' | 'fail' | 'na') {
  const key = `${status}|${result}`
  metrics.examSubmissions.set(key, (metrics.examSubmissions.get(key) || 0) + 1)
}

export function recordPaymentWebhook(provider: string, status: 'success' | 'failed') {
  const key = `${provider}|${status}`
  metrics.paymentWebhooks.set(key, (metrics.paymentWebhooks.get(key) || 0) + 1)
}

export function recordPaymentAmount(provider: string, amountGnf: number) {
  metrics.paymentAmounts.set(provider, (metrics.paymentAmounts.get(provider) || 0) + amountGnf)
}

export function recordBookingCreated(centre: string) {
  metrics.bookings.set(centre, (metrics.bookings.get(centre) || 0) + 1)
}

export function recordFraudAlert(type: string) {
  metrics.fraudAlerts.set(type, (metrics.fraudAlerts.get(type) || 0) + 1)
}
