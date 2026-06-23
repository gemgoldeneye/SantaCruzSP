// Public metadata — no auth (used by the login/portal pickers BEFORE login).
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { OFFICES } from '@gelabs/sp/modules';
import { db } from '../db/client.js';
import { tenants } from '@gelabs/sp/data';
import { env } from '../env.js';

export async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/meta', async () => {
    const rows = await db.select({ id: tenants.id, name: tenants.name, shortName: tenants.shortName, type: tenants.type })
      .from(tenants).where(eq(tenants.id, env.defaultTenant));
    return {
      tenant: rows[0] ?? { id: env.defaultTenant, name: 'Municipality of Santa Cruz', shortName: 'Santa Cruz', type: 'municipality' },
      offices: OFFICES.map((o) => ({ key: o.key, label: o.label, route: o.route, group: o.group })),
    };
  });
}
