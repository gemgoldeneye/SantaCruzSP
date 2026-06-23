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

/** A peer node the sync pump federates with (Phase 7). */
export interface PeerConfig { id: string; role: 'cloud' | 'onprem'; baseUrl: string; tenants: string[] }
function parsePeers(): PeerConfig[] {
  try { return JSON.parse(process.env.PEERS ?? '[]') as PeerConfig[]; } catch { return []; }
}

export const env = {
  nodeRole: (process.env.NODE_ROLE ?? 'cloud') as 'cloud' | 'onprem',
  nodeId: process.env.NODE_ID ?? 'cloud-hub',
  nodeToken: process.env.NODE_TOKEN ?? 'dev-node-token-shared-between-peers',
  peers: parsePeers(),
  port: Number(process.env.PORT ?? 8787),
  // Runtime connects as the NON-OWNER role so RLS applies. Migrations/admin use the owner URL.
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://zsp_app:zsp_app_dev@localhost:5500/sp',
  ownerDatabaseUrl: process.env.OWNER_DATABASE_URL ?? 'postgres://zsp:zsp_dev@localhost:5500/sp',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6400',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-secret-do-not-use-in-prod',
  // Seed mode: 'demo' = full demo data + logins; 'bootstrap' = ONE superadmin from
  // BOOTSTRAP_ADMIN_* env, NO demo accounts/documents/sessions (production onboarding).
  seedMode: (process.env.SEED_MODE ?? 'demo') as 'demo' | 'bootstrap',
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL,
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  // The province hub and the Santa Cruz municipal node.
  provinceTenant: process.env.PROVINCE_TENANT ?? 'zambales-province',
  defaultTenant: process.env.DEFAULT_TENANT ?? 'santacruz-zambales',
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
