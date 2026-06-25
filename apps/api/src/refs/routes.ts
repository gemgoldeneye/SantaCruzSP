// Ref-block leasing — official control numbers that stay official OFFLINE.
// A device leases a block of sequential numbers per (collection, series); offline
// issuance consumes from the block, so the printed number is real, not provisional.
import type { FastifyInstance } from 'fastify';
import { and, eq, sql as rawSql } from 'drizzle-orm';
import { z } from 'zod';
import { getCollection } from '@gelabs/sp/contracts';
import { refCounters, refLeases } from '@gelabs/sp/data';
import { withTenantWrite } from '../db/tenant.js';
import { requireUser, assertCan } from '../auth/guard.js';
import { audit } from '../audit.js';

const leaseSchema = z.object({
  collection: z.string().min(1).max(128),
  series: z.string().min(1).max(64),
  count: z.number().int().min(1).max(100).default(50),
  deviceId: z.string().min(1).max(128),
});

export async function refRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);

  app.post('/api/refs/lease', async (req, reply) => {
    const parsed = leaseSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'validation_failed' });
    const { collection, series, count, deviceId } = parsed.data;

    const def = getCollection(collection);
    if (!def) return reply.code(404).send({ error: 'unknown_collection' });
    if (!assertCan(req, reply, 'encode', def.office ?? '__none__')) return;

    const lease = await withTenantWrite(async (tx) => {
      await tx.insert(refCounters)
        .values({ collection, series, next: 1 })
        .onConflictDoNothing();
      const rows = await tx.update(refCounters)
        .set({ next: rawSql`${refCounters.next} + ${count}` })
        .where(and(
          eq(refCounters.collection, collection),
          eq(refCounters.series, series),
        )).returning();
      const next = rows[0]!.next;
      const start = next - count;
      const end = next - 1;
      await tx.insert(refLeases).values({
        collection, series, deviceId,
        leasedTo: req.user!.id, rangeStart: start, rangeEnd: end,
      });
      await audit({
        actorId: req.user!.id, actorName: req.user!.name,
        actorRole: req.user!.role, action: 'refs.lease', collection,
        detail: { series, start, end, deviceId },
      }, tx);
      return { series, start, end };
    });

    return lease;
  });
}
