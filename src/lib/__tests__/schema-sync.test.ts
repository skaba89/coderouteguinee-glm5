/**
 * Schema sync test — ensures SQLite and PostgreSQL Prisma schemas
 * define the same models/fields so the production migration cannot
 * silently drift from the development schema.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function extractModels(schemaPath: string): string {
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  const content = readFileSync(schemaPath, 'utf-8');
  // Return everything from the first "model " or "enum " line to EOF.
  const lines = content.split('\n');
  let started = false;
  const out: string[] = [];
  for (const line of lines) {
    if (/^(model|enum) /.test(line)) started = true;
    if (started) out.push(line);
  }
  return out.join('\n');
}

describe('Prisma schema sync (SQLite ↔ PostgreSQL)', () => {
  const sqlitePath = resolve(__dirname, '../../../prisma/schema.prisma');
  const pgPath = resolve(__dirname, '../../../prisma/schema-postgres.prisma');

  it('both schema files exist', () => {
    expect(existsSync(sqlitePath)).toBe(true);
    expect(existsSync(pgPath)).toBe(true);
  });

  it('PostgreSQL schema uses postgresql provider', () => {
    const content = readFileSync(pgPath, 'utf-8');
    // Accept any whitespace between "provider" and "=" (alignment-friendly)
    expect(content).toMatch(/provider\s+=\s+"postgresql"/);
  });

  it('SQLite schema uses sqlite provider', () => {
    const content = readFileSync(sqlitePath, 'utf-8');
    expect(content).toContain('provider = "sqlite"');
  });

  it('models and fields match between SQLite and PostgreSQL variants', () => {
    // The two schemas intentionally diverge at the TYPE level
    // (SQLite uses String fields, PG uses native enums + jsonb).
    // We compare MODEL NAMES and FIELD NAMES only — not types.
    // See prisma/schema-postgres.prisma header comment for rationale.

    function extractModelAndFieldNames(schemaPath: string): Record<string, string[]> {
      const content = readFileSync(schemaPath, 'utf-8');
      const models: Record<string, string[]> = {};
      const modelRegex = /^model\s+(\w+)\s+{([\s\S]*?)^}/gm;
      let match: RegExpExecArray | null;
      while ((match = modelRegex.exec(content)) !== null) {
        const modelName = match[1];
        const body = match[2];
        // Extract field names (first word of each non-comment, non-attribute line)
        const fields: string[] = [];
        for (const line of body.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;
          const fieldName = trimmed.split(/\s+/)[0];
          if (fieldName && !fieldName.startsWith('//')) {
            fields.push(fieldName);
          }
        }
        models[modelName] = fields.sort();
      }
      return models;
    }

    const sqliteModels = extractModelAndFieldNames(sqlitePath);
    const pgModels = extractModelAndFieldNames(pgPath);

    const sqliteNames = Object.keys(sqliteModels).sort();
    const pgNames = Object.keys(pgModels).sort();
    expect(sqliteNames).toEqual(pgNames);

    // For each model, the field names must match (order-independent)
    for (const modelName of sqliteNames) {
      expect(pgModels[modelName]).toBeDefined();
      expect(pgModels[modelName]).toEqual(sqliteModels[modelName]);
    }
  });
});
