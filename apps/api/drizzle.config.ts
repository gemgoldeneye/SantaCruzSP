import { defineConfig } from 'drizzle-kit';
import { existsSync, readFileSync } from 'node:fs';

// Local dev: load apps/api/.env so `db:migrate` targets the SAME DB as the app + seed.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1] as string;
    if (process.env[key] === undefined) process.env[key] = (m[2] ?? '').trim().replace(/^(["'])(.*)\1$/, '$2');
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Migrations run as the OWNER role (bypasses RLS).
    url: process.env.OWNER_DATABASE_URL ?? 'postgres://zsp:zsp_dev@localhost:5500/sp',
  },
  schemaFilter: ['platform', 'data'],
});
