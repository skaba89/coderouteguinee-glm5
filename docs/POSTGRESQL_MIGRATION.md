# PostgreSQL Migration Guide — CodeRoute Guinée

This guide explains how to migrate the CodeRoute Guinée database from **SQLite** (development) to **PostgreSQL** (production).

## Why migrate?

SQLite is great for local development but has limitations for production:

- **Single-writer concurrency**: only one write transaction at a time
- **No built-in replication**: cannot scale horizontally
- **File-based**: tied to a single disk on a single machine
- **No row-level security** or advanced extensions

PostgreSQL solves all of these and is the recommended target for production deployments.

## Prerequisites

- Docker 20+ and Docker Compose v2 (for local PostgreSQL)
- OR a managed PostgreSQL instance (Supabase, Neon, RDS, etc.)
- The `psql` CLI client (for the migration script)

## Quick start (local Docker)

```bash
# 1. Start a local PostgreSQL 16 container
npm run pg:up
# (alias for: docker compose -f docker-compose.postgres.yml up -d)

# 2. Verify it's healthy
docker ps --filter name=coderoute-postgres

# 3. Switch the active Prisma schema to PostgreSQL
npm run db:use-postgres
# This copies prisma/schema-postgres.prisma → prisma/schema.prisma

# 4. Update .env
#   DATABASE_URL="postgresql://coderoute:coderoute@localhost:5432/coderoute"

# 5. Apply schema to PostgreSQL
npx prisma migrate dev --name init

# 6. (Optional) Migrate existing SQLite data
npm run db:migrate-to-pg

# 7. Restart the app
npm run dev
```

## Inspecting the database

A local **Adminer** instance is exposed at <http://localhost:8080>:

- System: PostgreSQL
- Server: `postgres`
- User: `coderoute`
- Password: `coderoute`
- Database: `coderoute`

## Going back to SQLite

```bash
npm run db:use-sqlite
# Restore DATABASE_URL in .env:
#   DATABASE_URL="file:/home/z/my-project/db/custom.db"
npx prisma generate && npx prisma db push
npm run dev
```

## Keeping schemas in sync

When you add or change a Prisma model, **edit `prisma/schema.prisma` first** (the active SQLite variant), then sync the change to the PostgreSQL variant:

```bash
npm run db:sync-schemas
```

A Jest test (`src/lib/__tests__/schema-sync.test.ts`) automatically verifies on every `npm test` run that the two schemas do not drift.

## Production checklist

Before going live with PostgreSQL:

1. [ ] Set `DATABASE_URL` to a managed PostgreSQL connection string (Supabase / Neon / RDS / self-hosted)
2. [ ] Run `npx prisma migrate deploy` (NOT `migrate dev` — that prompts and resets)
3. [ ] Verify `prisma migrate status` shows all migrations applied
4. [ ] Run the seed: `npx prisma db seed`
5. [ ] Smoke-test login + booking + payment flows
6. [ ] Set up automated backups (`pg_dump` daily + WAL archiving)
7. [ ] Configure connection pooling (PgBouncer or Supabase pooler) for production traffic
8. [ ] Remove the local `db/custom.db` file from version control (already in `.gitignore`)

## Environment variables

| Variable | SQLite (dev) | PostgreSQL (prod) |
|---|---|---|
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | `postgresql://user:pass@host:5432/coderoute?schema=public` |

## Extensions enabled by default

The init script (`scripts/postgres-init/01-init.sql`) enables:

- **citext** — case-insensitive text columns (better email matching)
- **pgcrypto** — `gen_random_uuid()` for seeds
- **pg_trgm** — trigram-based fuzzy search (for future search features)

## Troubleshooting

**"Cannot connect to PostgreSQL"**
- Check the container is healthy: `docker ps`
- Check the URL in `.env` matches the docker-compose credentials

**"Table does not exist"** during migration
- You skipped step 5 (`prisma migrate dev`). The schema must be applied first.

**Schema drift detected**
- Run `npm run db:sync-schemas` to copy models from SQLite to PG variant.

## Files added in Phase 28

| Path | Purpose |
|---|---|
| `docker-compose.postgres.yml` | Local PostgreSQL 16 + Adminer |
| `scripts/postgres-init/01-init.sql` | DB extensions on first init |
| `scripts/migrate-sqlite-to-postgres.sh` | Stream SQLite → PG via CSV |
| `scripts/sync-schemas.sh` | Copy models from SQLite schema → PG schema |
| `scripts/verify-schema-sync.sh` | Diff the two schemas (CI-friendly) |
| `src/lib/__tests__/schema-sync.test.ts` | Jest test that fails on schema drift |
| `docs/POSTGRESQL_MIGRATION.md` | This document |
