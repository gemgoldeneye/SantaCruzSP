import { defineConfig } from 'drizzle-kit';

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
