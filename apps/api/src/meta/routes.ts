// Public metadata — no auth (used by the login/portal pickers BEFORE login).
// Single-tenant: identity comes from the per-LGU config, not a tenants table.
import type { FastifyInstance } from 'fastify';
import { OFFICES } from '@gelabs/sp/modules';
import { santaCruzConfig } from '@lgu/santacruz';

export async function metaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/meta', async () => {
    return {
      tenant: {
        id: santaCruzConfig.tenant.tenantId,
        name: santaCruzConfig.municipality.name,
        shortName: santaCruzConfig.municipality.shortName,
        type: 'municipality' as const,
      },
      offices: OFFICES.map((o) => ({ key: o.key, label: o.label, route: o.route, group: o.group })),
    };
  });
}
