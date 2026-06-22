-- ============================================================
-- CodeRoute Guinée — PostgreSQL init script
-- Runs once on first container init (docker-entrypoint-initdb.d)
-- ============================================================

-- Ensure UTF-8 encoding (also enforced in compose env, but be explicit)
SET client_encoding = 'UTF8';

-- Enable extension: citext for case-insensitive emails (better UX)
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable extension: pgcrypto for gen_random_uuid() (used by some seeds)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: pg_trgm for fuzzy search on users / questions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'CodeRoute Guinée — PostgreSQL initialized with citext, pgcrypto, pg_trgm extensions';
END
$$;
