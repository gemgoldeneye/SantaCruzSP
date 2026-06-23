// Santa Cruz Sanggunian platform API entrypoint.
import { defineSpRuntime } from '@gelabs/sp/runtime';
import { santaCruzConfig } from '@lgu/santacruz';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './env.js';
import { sql } from './db/client.js';
import { reconcileSuperadmin } from './db/superadmin.js';
import { redis } from './redis.js';
import { authRoutes } from './auth/routes.js';
import { citizenAuthRoutes } from './auth/citizen.js';
import { documentRoutes } from './documents/routes.js';
import { syncRoutes } from './sync/routes.js';
import { workflowRoutes } from './workflow/routes.js';
import { refRoutes } from './refs/routes.js';
import { adminRoutes } from './admin/routes.js';
import { notificationRoutes } from './notifications/routes.js';
import { reportRoutes } from './reports/routes.js';
import { paymentsRoutes } from './payments/routes.js';
import { verifyRoutes } from './verify/routes.js';
import { publicRoutes } from './public/routes.js';
import { nodeRoutes } from './node/routes.js';
import { metaRoutes } from './meta/routes.js';

// Boot the SP runtime: registers the standard domain modules + loads the per-LGU
// config (Santa Cruz). Must precede any request handling.
defineSpRuntime(santaCruzConfig);

const app = Fastify({ logger: env.isDev ? { level: 'info' } : true });

// Dev: Vite frontends call the API cross-origin with session cookies.
await app.register(cors, { origin: env.corsOrigins, credentials: true });
await app.register(cookie, { secret: env.sessionSecret });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
await app.register(authRoutes);
await app.register(citizenAuthRoutes);
await app.register(documentRoutes);
await app.register(syncRoutes);
await app.register(workflowRoutes);
await app.register(refRoutes);
await app.register(adminRoutes);
await app.register(notificationRoutes);
await app.register(reportRoutes);
await app.register(paymentsRoutes);
await app.register(verifyRoutes);
await app.register(publicRoutes);
await app.register(nodeRoutes);
await app.register(metaRoutes);

// Heartbeat target for the sync-client connectivity detector. Must stay cheap.
app.get('/healthz', async () => {
  const [pg, rd] = await Promise.allSettled([sql`select 1`, redis.ping()]);
  return {
    ok: pg.status === 'fulfilled' && rd.status === 'fulfilled',
    role: env.nodeRole,
    db: pg.status === 'fulfilled',
    redis: rd.status === 'fulfilled',
  };
});

// Single source of truth: reconcile the env-defined superadmin (apps/api/.env) on
// every boot — idempotent. Change SUPERADMIN_EMAIL/PASSWORD + restart to take effect.
await reconcileSuperadmin();

await app.listen({ port: env.port, host: '0.0.0.0' });
app.log.info(`sp-api (${env.nodeRole}) listening on :${env.port}`);
