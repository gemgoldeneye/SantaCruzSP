// Public transparency reads — UNAUTHENTICATED, fixed-tenant (Santa Cruz). Exposes only
// citizenAccess:'public' projections: published projects + enacted ordinances.
// Anonymous citizens browse these without an OTP session (the sync pull requires
// a session, so these dedicated endpoints back the public portal home).
import type { FastifyInstance } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { documents } from '@gelabs/sp/data';
import { withTenant } from '../db/tenant.js';
import { env } from '../env.js';

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/public/projects', async () =>
    withTenant(env.defaultTenant, async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.tenantId, env.defaultTenant),
        eq(documents.collection, 'sp.portal.projects'),
        isNull(documents.deletedAt),
      )).limit(500);
      return { projects: rows.map((r) => r.doc) };
    }),
  );

  app.get('/api/public/ordinances', async () =>
    withTenant(env.defaultTenant, async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.tenantId, env.defaultTenant),
        eq(documents.collection, 'sp.sanggunian.documents'),
        isNull(documents.deletedAt),
      )).limit(500);
      // Only enacted measures are public; strip the heavy OCR blob.
      const enacted = rows
        .map((r) => r.doc as Record<string, unknown>)
        .filter((d) => d.stage === 'enacted')
        .map(({ extractedText, ...rest }) => { void extractedText; return rest; });
      return { ordinances: enacted };
    }),
  );
}
