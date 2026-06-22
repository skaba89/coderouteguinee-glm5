# ============================================================
# CodeRoute Guinée — Production Dockerfile (multi-stage)
# ============================================================
# Builds a minimal standalone Next.js image (~150 MB) that runs
# without dev dependencies. Optimized for:
#   - Security: runs as non-root user `nextjs` (uid 1001)
#   - Size: Alpine base + standalone output
#   - Cache: yarn/npm cache mounted as BuildKit cache
#   - Health: wget-based HEALTHCHECK hitting /api/health
# ============================================================

# ─── Stage 1: deps ────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy lockfile + package.json first for cache
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install ALL deps (including devDeps needed for prisma generate)
RUN npm ci --include=dev && npx prisma generate

# ─── Stage 2: builder ─────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry — disable for reproducible builds
ENV NEXT_TELEMETRY_DISABLED=1

# Build the standalone output
# Note: ignoreBuildErrors is FALSE (set in next.config.ts)
RUN npm run build

# ─── Stage 3: runner (minimal production image) ───────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini wget

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone build output + public assets + prisma migrations
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000

# tini = proper PID 1 signal handling (Ctrl+C, SIGTERM)
ENTRYPOINT ["/sbin/tini", "--"]

# Healthcheck — hit /api/health every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
