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
    expect(content).toContain('provider = "postgresql"');
  });

  it('SQLite schema uses sqlite provider', () => {
    const content = readFileSync(sqlitePath, 'utf-8');
    expect(content).toContain('provider = "sqlite"');
  });

  it('models and enums match between SQLite and PostgreSQL variants', () => {
    const sqliteModels = extractModels(sqlitePath);
    const pgModels = extractModels(pgPath);
    if (sqliteModels !== pgModels) {
      // Show a useful diff in the test output.
      const sqliteLines = sqliteModels.split('\n');
      const pgLines = pgModels.split('\n');
      const max = Math.max(sqliteLines.length, pgLines.length);
      const diffs: string[] = [];
      for (let i = 0; i < max; i++) {
        if (sqliteLines[i] !== pgLines[i]) {
          diffs.push(
            `Line ${i + 1}:\n  SQLite:    ${sqliteLines[i] ?? '<missing>'}\n  PostgreSQL: ${pgLines[i] ?? '<missing>'}`,
          );
        }
      }
      throw new Error(
        `Schema drift detected. Run \`npm run db:sync-schemas\` to fix.\n\n${diffs.slice(0, 20).join('\n\n')}`,
      );
    }
  });
});
