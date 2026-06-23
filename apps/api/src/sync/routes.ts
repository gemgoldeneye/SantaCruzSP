// Sync endpoints — the wire protocol of the offline-first contract.
//   POST /api/sync/push   batch ≤50 mutations, FIFO, per-mutation results
//   GET  /api/sync/pull   change feed from a monotonic cursor
// Serves BOTH staff (office-RBAC) and citizens (mobile/OTP, accountId-scoped).
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { and, eq, gt, inArray } from 'drizzle-orm';
import {
  allCollections, can, mutationEnvelopeSchema,
  type ChangeRow, type MutationEnvelope, type PushResultEntry, type User,
} from '@gelabs/sp/contracts';
import { changeLog, documents } from '@gelabs/sp/data';
import { withTenant } from '../db/tenant.js';
import { audit } from '../audit.js';
import { getSession, SESSION_COOKIE } from '../auth/session.js';
import { getCitizenSession, CITIZEN_COOKIE, type CitizenIdentity } from '../auth/citizen.js';
import { ingestMutation, loadActors, type IngestActor } from './ingest.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PULL_LIMIT = 500;

type SyncActor =
  | { kind: 'staff'; user: User; tenantId: string }
  | { kind: 'citizen'; citizen: CitizenIdentity; tenantId: string };

/** Resolve a staff OR citizen session from the request cookies. */
async function getSyncActor(req: FastifyRequest): Promise<SyncActor | null> {
  const staffRaw = req.cookies[SESSION_COOKIE];
  if (staffRaw) {
    const u = req.unsignCookie(staffRaw);
    if (u.valid && u.value) {
      const s = await getSession(u.value);
      if (s) return { kind: 'staff', user: s.user, tenantId: s.tenantId };
    }
  }
  const citRaw = req.cookies[CITIZEN_COOKIE];
  if (citRaw) {
    const u = req.unsignCookie(citRaw);
    if (u.valid && u.value) {
      const c = await getCitizenSession(u.value);
      if (c) return { kind: 'citizen', citizen: c, tenantId: c.tenantId };
    }
  }
  return null;
}

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/sync/push', async (req, reply) => {
    const actor = await getSyncActor(req);
    if (!actor) return reply.code(401).send({ error: 'unauthenticated' });

    // Envelope-level checks ONLY (deviceId + a bounded mutations array). Each
    // mutation is validated INDIVIDUALLY below — a single malformed mutation is
    // dead-lettered to the attention tray instead of 400-ing the whole batch.
    // A batch-level 400 makes api.push throw on the client, which silently wedges
    // the ENTIRE outbox (valid ops included) in a pending retry loop forever.
    const body = req.body as { deviceId?: unknown; mutations?: unknown };
    if (typeof body?.deviceId !== 'string' || body.deviceId.length < 1 || body.deviceId.length > 128
        || !Array.isArray(body.mutations) || body.mutations.length < 1 || body.mutations.length > 50) {
      return reply.code(400).send({ error: 'validation_failed', detail: 'invalid push envelope' });
    }

    const tenantId = actor.tenantId;
    const results: PushResultEntry[] = [];

    // Split well-formed mutations from malformed ones. Malformed ones get a
    // per-item `rejected` result so the client surfaces them in the attention
    // tray (visible, resolvable) rather than retrying a doomed batch silently.
    const valid: MutationEnvelope[] = [];
    for (const raw of body.mutations) {
      const p = mutationEnvelopeSchema.safeParse(raw);
      if (p.success) { valid.push(p.data); continue; }
      const id = typeof (raw as { id?: unknown })?.id === 'string' ? (raw as { id: string }).id : '';
      results.push({
        id, status: 'rejected', code: 'validation_failed',
        detail: JSON.stringify(p.error.issues.slice(0, 5)).slice(0, 500),
      });
    }

    if (actor.kind === 'staff') {
      // Staff: validate each mutation against its RECORDED actor (shared desks).
      const actorIds = [...new Set(valid.map((m) => m.actor.userId))];
      const actors = await loadActors(tenantId, actorIds);
      for (const m of valid) {
        const u = actors.get(m.actor.userId);
        const ctx: IngestActor | null = u ? { kind: 'staff', user: u } : null;
        results.push(await ingestMutation(tenantId, m, ctx));
      }
    } else {
      // Citizen: the session IS the actor; may only create own records.
      const ctx: IngestActor = {
        kind: 'citizen',
        account: { id: actor.citizen.id, name: actor.citizen.name, barangayId: actor.citizen.barangayId },
      };
      for (const m of valid) {
        results.push(await ingestMutation(tenantId, m, ctx));
      }
    }
    return { results };
  });

  app.get('/api/sync/pull', async (req, reply) => {
    const actor = await getSyncActor(req);
    if (!actor) return reply.code(401).send({ error: 'unauthenticated' });
    const tenantId = actor.tenantId;
    const q = req.query as { cursor?: string };
    const cursor = Number(q.cursor ?? 0) || 0;

    // Which collections this actor may see, and (for citizens) how to scope rows.
    const allowedDefs = actor.kind === 'staff'
      ? allCollections().filter((d) => can(actor.user, 'view', d.office ?? '__none__'))
      : allCollections().filter((d) => d.citizenAccess !== undefined);
    const allowed = allowedDefs.map((d) => d.key);
    const citizenAccessByKey = new Map(allowedDefs.map((d) => [d.key, d.citizenAccess]));
    if (allowed.length === 0) return { changes: [], cursor: String(cursor), hasMore: false };

    return withTenant(tenantId, async (tx) => {
      const rows = await tx.select().from(changeLog).where(and(
        eq(changeLog.tenantId, tenantId),
        gt(changeLog.seq, cursor),
        inArray(changeLog.collection, allowed),
      )).orderBy(changeLog.seq).limit(PULL_LIMIT);

      if (rows.length === 0) return { changes: [], cursor: String(cursor), hasMore: false };

      // Collapse multiple change_log entries per doc to the last one.
      const lastByDoc = new Map<string, typeof rows[number]>();
      for (const r of rows) lastByDoc.set(`${r.collection} ${r.docId}`, r);

      const byCollection = new Map<string, string[]>();
      for (const r of lastByDoc.values()) {
        const list = byCollection.get(r.collection) ?? [];
        list.push(r.docId);
        byCollection.set(r.collection, list);
      }
      const docRows = (await Promise.all([...byCollection.entries()].map(([coll, ids]) =>
        tx.select().from(documents).where(and(
          eq(documents.tenantId, tenantId), eq(documents.collection, coll), inArray(documents.id, ids),
        )),
      ))).flat();
      const docByKey = new Map(docRows.map((d) => [`${d.collection} ${d.id}`, d]));

      const changes: ChangeRow[] = [];
      for (const r of lastByDoc.values()) {
        const d = docByKey.get(`${r.collection} ${r.docId}`);
        if (!d) continue;
        // Citizen row-scoping: 'own' collections are filtered to this account.
        if (actor.kind === 'citizen' && citizenAccessByKey.get(r.collection) === 'own') {
          if ((d.doc as { accountId?: string }).accountId !== actor.citizen.id) continue;
        }
        const deleted = d.deletedAt !== null;
        const row: ChangeRow = { collection: r.collection, id: r.docId, version: d.rowVersion, deleted, ref: d.ref };
        if (!deleted) row.data = d.doc;
        changes.push(row);
      }
      const lastSeq = rows[rows.length - 1]!.seq;
      return { changes, cursor: String(lastSeq), hasMore: rows.length === PULL_LIMIT };
    });
  });

  // Records how a sync rejection was resolved on a device (server-wins / re-issued
  // my change / acknowledged) so a conflict leaves an audit trail instead of a
  // silently-discarded edit. Append-only; the actual data change rode the normal
  // push/pull path — this is the COA-visible note that it happened.
  app.post('/api/sync/resolution', async (req, reply) => {
    const actor = await getSyncActor(req);
    if (!actor) return reply.code(401).send({ error: 'unauthenticated' });
    const b = (req.body ?? {}) as Record<string, unknown>;
    const collection = typeof b.collection === 'string' ? b.collection.slice(0, 128) : '';
    const entityId = typeof b.entityId === 'string' ? b.entityId : '';
    const code = typeof b.code === 'string' ? b.code.slice(0, 64) : 'unknown';
    const op = typeof b.op === 'string' ? b.op.slice(0, 32) : null;
    const resolution = ['keep_theirs', 'use_mine', 'acknowledged'].includes(b.resolution as string)
      ? (b.resolution as string) : 'acknowledged';
    if (!collection || !entityId) return reply.code(400).send({ error: 'validation_failed' });

    const tenantId = actor.tenantId;
    const who = actor.kind === 'staff'
      ? { id: actor.user.id, name: actor.user.name, role: actor.user.role }
      : { id: actor.citizen.id, name: actor.citizen.name, role: 'citizen' };
    await withTenant(tenantId, (tx) => audit({
      tenantId, actorId: who.id, actorName: who.name, actorRole: who.role,
      action: `sync.resolve.${resolution}`, collection,
      ...(UUID_RE.test(entityId) ? { docId: entityId } : {}),
      detail: { code, op, ...(UUID_RE.test(entityId) ? {} : { entityId }) },
    }, tx));
    return { ok: true };
  });
}
