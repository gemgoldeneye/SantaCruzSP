// Public MTOP QR verification — UNAUTHENTICATED read. The source of validity truth
// is server-side franchise status, so a citizen device must not trust a stale
// local cache. Returns a minimal projection of an issued MTOP.
import type { FastifyInstance } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { documents } from '@gelabs/sp/data';
import { withTenant } from '../db/tenant.js';

const MTOP_COLLECTION = 'sp.mtop.mtops';

interface MtopDoc {
  ref?: string; status?: string; operator?: string; unit?: string;
  validFrom?: string; validTo?: string; zoneId?: string; todaId?: string;
}

export async function verifyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/prangkisa/verify', async (req, reply) => {
    const no = String((req.query as { no?: string }).no ?? '').trim();
    if (!no) return reply.code(400).send({ error: 'missing_no' });

    return withTenant(async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.collection, MTOP_COLLECTION),
        eq(documents.ref, no),
        isNull(documents.deletedAt),
      )).limit(1);
      const row = rows[0];
      if (!row) return reply.code(404).send({ found: false });
      const d = row.doc as MtopDoc;
      // Minimal public projection — no applicant PII.
      return {
        found: true,
        no: d.ref ?? row.ref,
        status: d.status ?? 'unknown',
        operator: d.operator ?? null,
        unit: d.unit ?? null,
        validFrom: d.validFrom ?? null,
        validTo: d.validTo ?? null,
        zone: d.zoneId ?? null,
        toda: d.todaId ?? null,
      };
    });
  });
}
