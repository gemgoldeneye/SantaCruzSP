// Node-to-node sync — the on-prem ↔ cloud pump. It reuses the EXACT change_log /
// documents / origin machinery the browser sync client uses; an on-prem box is
// just a privileged sync client that pulls a peer's deltas and applies them
// locally, tagging origin=`peer:<id>` so they never echo back.
import { and, eq, gt, ne, inArray, sql as rawSql } from 'drizzle-orm';
import { getCollection } from '@gelabs/sp/contracts';
import { changeLog, documents, nodeCursors } from '@gelabs/sp/data';
import { withTenant, withTenantWrite } from '../db/tenant.js';
import { logChange } from '../documents/changeLog.js';
import { env } from '../env.js';
import { classFlows, type NodeRole } from './policy.js';

const SCAN_LIMIT = 500;

export interface NodeChange { collection: string; id: string; rowVersion: number; deleted: boolean; op: string; doc?: unknown; ref?: string | null }

/**
 * Changes this node will serve to a pulling peer: change_log since `cursor`,
 * minus anything that originated FROM that peer (echo-loop prevention), keeping
 * only collections whose sync-class flows fromRole→toRole.
 */
export async function changesForPeer(
  tenantId: string, cursor: number, fromRole: NodeRole, toRole: NodeRole, excludePeerId: string,
): Promise<{ changes: NodeChange[]; cursor: number; hasMore: boolean }> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx.select().from(changeLog).where(and(
      eq(changeLog.tenantId, tenantId),
      gt(changeLog.seq, cursor),
      ne(changeLog.origin, `peer:${excludePeerId}`),
    )).orderBy(changeLog.seq).limit(SCAN_LIMIT);
    if (rows.length === 0) return { changes: [], cursor, hasMore: false };

    const lastSeq = Number(rows[rows.length - 1]!.seq);
    const eligible = rows.filter((r) => classFlows(getCollection(r.collection)?.syncClass, fromRole, toRole));
    const lastByDoc = new Map<string, typeof rows[number]>();
    for (const r of eligible) lastByDoc.set(`${r.collection} ${r.docId}`, r);
    if (lastByDoc.size === 0) return { changes: [], cursor: lastSeq, hasMore: rows.length === SCAN_LIMIT };

    const byCollection = new Map<string, string[]>();
    for (const r of lastByDoc.values()) {
      const list = byCollection.get(r.collection) ?? [];
      list.push(r.docId);
      byCollection.set(r.collection, list);
    }
    const docRows = (await Promise.all([...byCollection.entries()].map(([coll, ids]) =>
      tx.select().from(documents).where(and(eq(documents.tenantId, tenantId), eq(documents.collection, coll), inArray(documents.id, ids))),
    ))).flat();
    const docByKey = new Map(docRows.map((d) => [`${d.collection} ${d.id}`, d]));

    const changes: NodeChange[] = [];
    for (const r of lastByDoc.values()) {
      const d = docByKey.get(`${r.collection} ${r.docId}`);
      if (!d) continue;
      const deleted = d.deletedAt !== null;
      changes.push({ collection: r.collection, id: r.docId, rowVersion: d.rowVersion, deleted, op: r.op, ref: d.ref, ...(deleted ? {} : { doc: d.doc }) });
    }
    return { changes, cursor: lastSeq, hasMore: rows.length === SCAN_LIMIT };
  });
}

/** Apply a peer's changes locally, tagged origin=`peer:<fromPeerId>`. Idempotent. */
export async function applyFromPeer(tenantId: string, fromPeerId: string, changes: NodeChange[]): Promise<number> {
  if (changes.length === 0) return 0;
  let applied = 0;
  await withTenantWrite(tenantId, async (tx) => {
    for (const c of changes) {
      const ref = c.ref ?? (c.doc as { ref?: string } | undefined)?.ref ?? null;
      const inserted = await tx.insert(documents).values({
        tenantId, collection: c.collection, id: c.id, ref,
        doc: (c.doc ?? {}) as Record<string, unknown>,
        deletedAt: c.deleted ? rawSql`now()` : null,
      }).onConflictDoUpdate({
        target: [documents.tenantId, documents.collection, documents.id],
        set: { doc: (c.doc ?? {}) as Record<string, unknown>, ref, rowVersion: rawSql`${documents.rowVersion} + 1`, deletedAt: c.deleted ? rawSql`now()` : null, updatedAt: rawSql`now()` },
      }).returning();
      await logChange(tx, { tenantId, collection: c.collection, docId: c.id, op: c.deleted ? 'delete' : 'update', rowVersion: inserted[0]!.rowVersion, origin: `peer:${fromPeerId}` });
      applied += 1;
    }
  });
  return applied;
}

async function getCursor(peerId: string, tenantId: string): Promise<number> {
  const r = await withTenant(tenantId, (tx) => tx.select().from(nodeCursors).where(and(eq(nodeCursors.peerId, peerId), eq(nodeCursors.tenantId, tenantId))).limit(1));
  return r[0] ? Number(r[0].cursor) : 0;
}
async function setCursor(peerId: string, tenantId: string, cursor: number): Promise<void> {
  await withTenantWrite(tenantId, (tx) => tx.insert(nodeCursors).values({ peerId, tenantId, cursor })
    .onConflictDoUpdate({ target: [nodeCursors.peerId, nodeCursors.tenantId], set: { cursor, updatedAt: rawSql`now()` } }));
}

export interface PumpReport { peer: string; tenant: string; pulled: number; applied: number; cursor: number }

/** Pull from every configured peer and apply locally. The pump core. */
export async function pumpFromPeers(): Promise<PumpReport[]> {
  const reports: PumpReport[] = [];
  for (const peer of env.peers) {
    for (const tenant of peer.tenants) {
      const since = await getCursor(peer.id, tenant);
      const url = `${peer.baseUrl}/api/node/pull?tenant=${encodeURIComponent(tenant)}&since=${since}&peer=${encodeURIComponent(env.nodeId)}&peerRole=${env.nodeRole}`;
      const res = await fetch(url, { headers: { 'x-node-token': env.nodeToken } });
      if (!res.ok) { reports.push({ peer: peer.id, tenant, pulled: 0, applied: 0, cursor: since }); continue; }
      const body = await res.json() as { changes: NodeChange[]; cursor: number };
      const applied = await applyFromPeer(tenant, peer.id, body.changes);
      await setCursor(peer.id, tenant, body.cursor);
      reports.push({ peer: peer.id, tenant, pulled: body.changes.length, applied, cursor: body.cursor });
    }
  }
  return reports;
}
