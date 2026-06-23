// Generic document reads (the sync pull is the primary read path; these REST
// endpoints back server-side lookups and the workflow Inbox DTOs).
import type { FastifyInstance } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { can, getCollection } from '@gelabs/sp/contracts';
import { documents } from '@gelabs/sp/data';
import { withTenant } from '../db/tenant.js';
import { requireUser, assertCan } from '../auth/guard.js';

type DocRow = typeof documents.$inferSelect;

export interface DocDto { collection: string; id: string; ref: string | null; version: number; data: unknown }

export function rowToDto(row: DocRow): DocDto {
  return { collection: row.collection, id: row.id, ref: row.ref, version: row.rowVersion, data: row.doc };
}

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);

  app.get('/api/c/:collection', async (req, reply) => {
    const { collection } = req.params as { collection: string };
    const def = getCollection(collection);
    if (!def) return reply.code(404).send({ error: 'unknown_collection' });
    if (!assertCan(req, reply, 'view', def.office ?? '__none__')) return;
    return withTenant(req.tenantId!, async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.tenantId, req.tenantId!), eq(documents.collection, def.key), isNull(documents.deletedAt),
      )).limit(2000);
      return { items: rows.map(rowToDto) };
    });
  });

  app.get('/api/c/:collection/:id', async (req, reply) => {
    const { collection, id } = req.params as { collection: string; id: string };
    const def = getCollection(collection);
    if (!def) return reply.code(404).send({ error: 'unknown_collection' });
    if (!can(req.user!, 'view', def.office ?? '__none__')) return reply.code(403).send({ error: 'permission_denied' });
    return withTenant(req.tenantId!, async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.tenantId, req.tenantId!), eq(documents.collection, def.key), eq(documents.id, id),
      )).limit(1);
      const row = rows[0];
      if (!row || row.deletedAt) return reply.code(404).send({ error: 'not_found' });
      return rowToDto(row);
    });
  });
}
