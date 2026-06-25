// Environment config — dev defaults point at deploy/dev/compose.yml ports (5500/6400).
import { existsSync, readFileSync } from 'node:fs';

// Local dev: load apps/api/.env if present (a REAL process env var still wins).
// Zero-dep; production injects env via the deploy compose, not a committed file.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1] as string;
    if (process.env[key] === undefined) process.env[key] = (m[2] ?? '').trim().replace(/^(["'])(.*)\1$/, '$2');
  }
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  // Runtime connects as the NON-OWNER role so RLS applies. Migrations/admin use the owner URL.
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://zsp_app:zsp_app_dev@localhost:5500/sp',
  ownerDatabaseUrl: process.env.OWNER_DATABASE_URL ?? 'postgres://zsp:zsp_dev@localhost:5500/sp',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6400',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-secret-do-not-use-in-prod',
  // Bootstrap superadmin (created by `db:seed`): the LGU's first/only admin login.
  superAdminEmail: process.env.SUPERADMIN_EMAIL,
  superAdminPassword: process.env.SUPERADMIN_PASSWORD,
  // LGU-OWNED payment gateway (NOT national eGovPay).
  payment: {
    provider: process.env.PAYMENT_PROVIDER ?? 'lgu_pay',
    baseUrl: process.env.PAYMENT_BASE_URL ?? 'http://localhost:9099',
    merchantId: process.env.PAYMENT_MERCHANT_ID ?? 'santacruz-lgu-dev',
    secret: process.env.PAYMENT_SECRET ?? 'dev-payment-secret',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-webhook-secret',
  },
  corsOrigins: (process.env.CORS_ORIGINS
    ?? 'http://localhost:5201,http://localhost:5175,http://localhost:5173').split(','),
  isDev: (process.env.NODE_ENV ?? 'development') !== 'production',
} as const;
