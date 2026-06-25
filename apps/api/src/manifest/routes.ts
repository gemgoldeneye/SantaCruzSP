// SDK manifest endpoint — lets the central @gelabs/sp dashboard poll this
// deployment's live state (version, DB tables/migrations, health). Token-gated via
// the GELABS_MANIFEST_TOKEN env var; the SDK ships the logic, this is just the glue.
import { createRequire } from 'node:module';
import type { FastifyInstance } from 'fastify';
import { createManifestHandler } from '@gelabs/sp/manifest';
import { sql } from '../db/client.js';
import { env } from '../env.js';

const require = createRequire(import.meta.url);
const { version } = require('@gelabs/sp/package.json') as { version: string };

export async function manifestRoutes(app: FastifyInstance): Promise<void> {
  const handle = createManifestHandler({
    app: {
      name: env.defaultTenant,
      env: env.isDev ? 'dev' : 'prod',
      tenantId: env.defaultTenant,
    },
    version,
    sql,
    bootMode: process.env.SEED_MODE,
    token: process.env.GELABS_MANIFEST_TOKEN,
  });

  app.get('/__gelabs/manifest', async (req, reply) => {
    const { status, body } = await handle({
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
    reply.code(status);
    return body;
  });
}
