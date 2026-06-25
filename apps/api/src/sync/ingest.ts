// Mutation ingestion — the server half of the offline-first contract.
// One transaction per mutation: ledger row + application + change_log + audit
// commit together or not at all. Replays (same mutation id) return the recorded
// result without re-executing. RBAC is checked against the RECORDED actor, not
// the pushing session (a shared desk may push another clerk's queued work).
import { and, eq, inArray } from 'drizzle-orm';
import {
  appendPayloadSchema, can, getCollection, getWorkflow, hasPermission, transitionPayloadSchema,
  type Bilingual, type Membership, type MutationEnvelope, type OfficeRoleKey,
  type PushResultEntry, type RoleKey, type User, type WorkflowInstance,
} from '@gelabs/sp/contracts';
import { documents, memberships as membershipsTable, mutations, roles as rolesTable, syncRejections, users } from '@gelabs/sp/data';
import { withTenantWrite, type TenantTx } from '../db/tenant.js';
import { db } from '../db/client.js';
import { logChange } from '../documents/changeLog.js';
import { audit } from '../audit.js';
import { applyTransition, upsertInstanceFromDoc } from '../workflow/service.js';
import { mirrorPromoted } from './promote.js';

type LedgerStatus = 'applied' | 'duplicate' | 'rejected' | 'dead_letter';

/** Who is applying a mutation — a staff user (office RBAC) or a citizen
 *  (mobile/OTP; accountId-scoped, may only create their own records). */
export type IngestActor =
  | { kind: 'staff'; user: User }
  | { kind: 'citizen'; account: { id: string; name: string; barangayId: string | null } };

/** Batch-load recorded actors (users + memberships) once per push. */
export async function loadActors(userIds: string[]): Promise<Map<string, User>> {
  const map = new Map<string, User>();
  if (userIds.length === 0) return map;
  const rows = await db.select().from(users).where(inArray(users.id, userIds));
  const mems = await db.select().from(membershipsTable).where(inArray(membershipsTable.userId, userIds));
  // The actor's legacy permission keys (e.g. sessions:manage) come from the role
  // assigned to the user — needed for collection-specific gates in ingest.
  const roleIds = [...new Set(rows.map((r) => r.roleId).filter((x): x is string => !!x))];
  const roleRows = roleIds.length
    ? await db.select({ id: rolesTable.id, permissions: rolesTable.permissions }).from(rolesTable).where(inArray(rolesTable.id, roleIds))
    : [];
  const permsByRole = new Map(roleRows.map((r) => [r.id, r.permissions]));
  for (const row of rows) {
    const m = mems.filter((x) => x.userId === row.id);
    const user: User = {
      id: row.id, name: row.name, role: row.role as RoleKey,
      title: (row.title ?? { fil: '', en: '' }) as Bilingual,
      offices: row.offices, initials: row.initials,
    };
    if (m.length > 0) user.memberships = m.map((x): Membership => ({ office: x.office, officeRole: x.officeRole as OfficeRoleKey }));
    const perms = row.roleId ? permsByRole.get(row.roleId) ?? [] : [];
    if (perms.length > 0) user.permissions = perms;
    map.set(row.id, user);
  }
  return map;
}

/** Union-merge events into an append-only array field (dedupe by deep equality). */
function unionAppend(existing: unknown, incoming: unknown[]): unknown[] {
  const base = Array.isArray(existing) ? [...existing] : [];
  const seen = new Set(base.map((e) => JSON.stringify(e)));
  for (const ev of incoming) {
    const k = JSON.stringify(ev);
    if (!seen.has(k)) { seen.add(k); base.push(ev); }
  }
  return base;
}

interface RejectArgs { tx: TenantTx; m: MutationEnvelope; reason: string; detail?: unknown }

async function recordRejection({ tx, m, reason, detail }: RejectArgs): Promise<void> {
  await tx.insert(syncRejections).values({ mutationId: m.id, reason, detail: detail ?? null });
}

export async function ingestMutation(
  m: MutationEnvelope,
  actorCtx: IngestActor | null,
): Promise<PushResultEntry> {
  return withTenantWrite(async (tx): Promise<PushResultEntry> => {
    // ── Idempotency: replays return the recorded result, never re-execute ────
    const prior = await tx.select().from(mutations).where(eq(mutations.id, m.id)).limit(1);
    if (prior[0]) {
      const p = prior[0];
      if (p.status === 'applied' || p.status === 'duplicate') {
        const entry: PushResultEntry = { id: m.id, status: 'duplicate' };
        if (p.resultVersion !== null) entry.serverVersion = p.resultVersion;
        return entry;
      }
      return { id: m.id, status: 'rejected', code: (p.error as { code?: string } | null)?.code as never ?? 'validation_failed' };
    }

    const act = actorCtx === null ? { id: m.actor.userId, name: 'unknown', role: 'citizen' as const }
      : actorCtx.kind === 'staff' ? actorCtx.user
      : { id: actorCtx.account.id, name: actorCtx.account.name, role: 'citizen' as const };

    const writeLedger = async (status: LedgerStatus, resultVersion?: number, error?: unknown) => {
      await tx.insert(mutations).values({
        id: m.id, actorKind: actorCtx?.kind ?? 'staff', actorId: act.id,
        deviceId: m.actor.deviceId, collection: m.collection, docId: m.entityId,
        op: m.op, baseVersion: m.baseVersion, payload: (m.payload ?? {}) as object,
        status, resultVersion: resultVersion ?? null,
        error: (error ?? null) as object | null,
        appliedAt: status === 'applied' ? new Date() : null,
      });
    };
    const reject = async (code: string, detail?: unknown, serverRow?: unknown): Promise<PushResultEntry> => {
      await writeLedger('rejected', undefined, { code, detail });
      await recordRejection({ tx, m, reason: code, ...(detail !== undefined ? { detail } : {}) });
      const entry: PushResultEntry = { id: m.id, status: 'rejected', code: code as never };
      if (detail !== undefined) entry.detail = typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 500);
      if (serverRow !== undefined) entry.serverRow = serverRow;
      return entry;
    };

    // ── Registry + actor + RBAC ───────────────────────────────────────────────
    const def = getCollection(m.collection);
    if (!def) return reject('unknown_collection');
    if (actorCtx === null) return reject('permission_denied', 'unknown actor');
    const office = def.office ?? '__none__';
    const isCitizen = actorCtx.kind === 'citizen';
    const staffUser: User | null = actorCtx.kind === 'staff' ? actorCtx.user : null;

    if (isCitizen && m.op !== 'create') return reject('permission_denied', 'citizens may only create');

    // Collection-specific permission gate (e.g. sessions:manage) — on top of the
    // per-op office-role check below. Staff only; executives bypass.
    if (staffUser && def.requiresPermission && !hasPermission(staffUser, def.requiresPermission)) {
      return reject('permission_denied', `requires ${def.requiresPermission}`);
    }

    const loadDoc = async () => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.collection, def.key), eq(documents.id, m.entityId),
      )).limit(1);
      return rows[0] ?? null;
    };

    switch (m.op) {
      case 'create': {
        const body = m.payload as Record<string, unknown> | null;
        if (!body || typeof body !== 'object') return reject('validation_failed', 'payload must be the document');
        if (isCitizen) {
          if (!def.citizenAccess) return reject('permission_denied');
          if (body.accountId !== actorCtx.account.id) return reject('permission_denied', 'accountId mismatch');
        } else if (!can(staffUser!, 'encode', office)) {
          return reject('permission_denied');
        }
        if (def.schema) {
          const parsed = def.schema.safeParse(body);
          if (!parsed.success) return reject('validation_failed', parsed.error.issues.slice(0, 5));
        }
        const existing = await loadDoc();
        if (existing) { // same entity created twice — first write wins, ack
          await writeLedger('applied', existing.rowVersion);
          return { id: m.id, status: 'acked', serverVersion: existing.rowVersion };
        }
        const inserted = await tx.insert(documents).values({
          collection: def.key, id: m.entityId,
          ref: typeof body.ref === 'string' && body.ref.length > 0 ? body.ref : null,
          doc: body, docVersion: def.docVersion,
          barangayId: typeof body.barangayId === 'string' ? body.barangayId : null,
          updatedBy: act.id,
        }).returning();
        const row = inserted[0]!;
        const wf = body.wf as WorkflowInstance | undefined;
        if (wf && getWorkflow(wf.def)) await upsertInstanceFromDoc(tx, def.key, m.entityId, wf);
        await mirrorPromoted(tx, def, m.entityId, body);
        await logChange(tx, { collection: def.key, docId: m.entityId, op: 'create', rowVersion: row.rowVersion, mutationId: m.id });
        await audit({ actorId: act.id, actorName: act.name, actorRole: act.role, action: 'create', collection: def.key, docId: m.entityId, mutationId: m.id }, tx);
        await writeLedger('applied', row.rowVersion);
        return { id: m.id, status: 'acked', serverVersion: row.rowVersion };
      }

      case 'update': {
        if (!staffUser) return reject('permission_denied');
        const patch = m.payload as Record<string, unknown> | null;
        if (!patch || typeof patch !== 'object') return reject('validation_failed', 'payload must be a field patch');
        const existing = await loadDoc();
        if (!existing || existing.deletedAt) return reject('not_found');

        const appendOnly = new Set(def.appendOnlyFields ?? []);
        const attestFields = new Set(def.attestFields ?? []);
        const patchedFields = Object.keys(patch);

        // Authorization: the owning office may encode. EXCEPTION — a clerk attesting
        // the CURRENT workflow step's required ref is authorized by their right to
        // ACT on that step (cross-office steps: Treasury cashier records payment).
        let authorized = can(staffUser, 'encode', office);
        if (!authorized && patchedFields.length > 0 && patchedFields.every((f) => attestFields.has(f))) {
          const wf = (existing.doc as { wf?: WorkflowInstance }).wf;
          const wfDef = wf ? getWorkflow(wf.def) : undefined;
          const step = wf && wfDef ? wfDef.steps[wf.current] : undefined;
          if (step && patchedFields.every((f) => (step.requiredRefs ?? []).includes(f)) && can(staffUser, step.action, step.office)) {
            authorized = true;
          }
        }
        if (!authorized) return reject('permission_denied');

        const stale = m.baseVersion !== existing.rowVersion;
        if (stale && !patchedFields.every((f) => appendOnly.has(f))) {
          return reject('version_conflict', { baseVersion: m.baseVersion, serverVersion: existing.rowVersion },
            { doc: existing.doc, rowVersion: existing.rowVersion });
        }
        const docNow = existing.doc as Record<string, unknown>;
        const nextDoc = { ...docNow };
        for (const f of patchedFields) {
          nextDoc[f] = appendOnly.has(f) && Array.isArray(patch[f])
            ? unionAppend(docNow[f], patch[f] as unknown[])
            : patch[f];
        }
        // Attestation: a manual externalRef is server-stamped with the RECORDED
        // actor + server clock. A cashier-recorded LGU-gateway payment settles now.
        const stampedAt = new Date().toISOString();
        const touchedAttest = patchedFields.filter((f) => attestFields.has(f));
        for (const f of touchedAttest) {
          const ref = nextDoc[f];
          if (ref && typeof ref === 'object' && (ref as { source?: string }).source === 'manual') {
            const r = ref as Record<string, unknown>;
            nextDoc[f] = {
              ...r, attestedBy: act.name, attestedAt: stampedAt,
              ...(r.provider === 'lgu_pay' && !r.settledAt ? { settledAt: stampedAt } : {}),
            };
          }
        }
        if (def.schema) {
          const parsed = def.schema.safeParse(nextDoc);
          if (!parsed.success) return reject('validation_failed', parsed.error.issues.slice(0, 5));
        }
        const updated = await tx.update(documents).set({
          doc: nextDoc, rowVersion: existing.rowVersion + 1, updatedAt: new Date(), updatedBy: act.id,
        }).where(and(
          eq(documents.collection, def.key), eq(documents.id, m.entityId),
        )).returning();
        const row = updated[0]!;
        await mirrorPromoted(tx, def, m.entityId, nextDoc);
        await logChange(tx, { collection: def.key, docId: m.entityId, op: 'update', rowVersion: row.rowVersion, mutationId: m.id });
        for (const f of touchedAttest) {
          const ref = nextDoc[f] as { provider?: string; value?: string; attachmentId?: string; source?: string } | undefined;
          if (ref && ref.source === 'manual') {
            await audit({ actorId: act.id, actorName: act.name, actorRole: act.role,
              action: `attest.${ref.provider ?? 'unknown'}`, collection: def.key, docId: m.entityId,
              detail: { field: f, value: ref.value, attachmentId: ref.attachmentId ?? null }, mutationId: m.id }, tx);
          }
        }
        const otherFields = patchedFields.filter((f) => !touchedAttest.includes(f));
        if (otherFields.length > 0) {
          await audit({ actorId: act.id, actorName: act.name, actorRole: act.role, action: 'update', collection: def.key, docId: m.entityId, detail: { fields: otherFields }, mutationId: m.id }, tx);
        }
        await writeLedger('applied', row.rowVersion);
        return { id: m.id, status: 'acked', serverVersion: row.rowVersion };
      }

      case 'append': {
        if (!staffUser || !can(staffUser, 'encode', office)) return reject('permission_denied');
        const parsed = appendPayloadSchema.safeParse(m.payload);
        if (!parsed.success) return reject('validation_failed', parsed.error.issues.slice(0, 5));
        const { field, events } = parsed.data;
        if (!(def.appendOnlyFields ?? []).includes(field)) {
          return reject('validation_failed', `field '${field}' is not append-only for ${def.key}`);
        }
        const existing = await loadDoc();
        if (!existing || existing.deletedAt) return reject('not_found');
        const docNow = existing.doc as Record<string, unknown>;
        const nextDoc = { ...docNow, [field]: unionAppend(docNow[field], events) };
        const updated = await tx.update(documents).set({
          doc: nextDoc, rowVersion: existing.rowVersion + 1, updatedAt: new Date(), updatedBy: act.id,
        }).where(and(
          eq(documents.collection, def.key), eq(documents.id, m.entityId),
        )).returning();
        const row = updated[0]!;
        await mirrorPromoted(tx, def, m.entityId, nextDoc);
        await logChange(tx, { collection: def.key, docId: m.entityId, op: 'append', rowVersion: row.rowVersion, mutationId: m.id });
        await audit({ actorId: act.id, actorName: act.name, actorRole: act.role, action: 'append', collection: def.key, docId: m.entityId, detail: { field, count: events.length }, mutationId: m.id }, tx);
        await writeLedger('applied', row.rowVersion);
        return { id: m.id, status: 'acked', serverVersion: row.rowVersion };
      }

      case 'delete': {
        if (!staffUser || !can(staffUser, 'encode', office)) return reject('permission_denied');
        const existing = await loadDoc();
        if (!existing || existing.deletedAt) return reject('not_found');
        if (m.baseVersion !== existing.rowVersion) {
          return reject('version_conflict', { baseVersion: m.baseVersion, serverVersion: existing.rowVersion },
            { doc: existing.doc, rowVersion: existing.rowVersion });
        }
        const updated = await tx.update(documents).set({
          deletedAt: new Date(), rowVersion: existing.rowVersion + 1, updatedAt: new Date(), updatedBy: act.id,
        }).where(and(
          eq(documents.collection, def.key), eq(documents.id, m.entityId),
        )).returning();
        const row = updated[0]!;
        await logChange(tx, { collection: def.key, docId: m.entityId, op: 'delete', rowVersion: row.rowVersion, mutationId: m.id });
        await audit({ actorId: act.id, actorName: act.name, actorRole: act.role, action: 'delete', collection: def.key, docId: m.entityId, mutationId: m.id }, tx);
        await writeLedger('applied', row.rowVersion);
        return { id: m.id, status: 'acked', serverVersion: row.rowVersion };
      }

      case 'transition': {
        if (!staffUser) return reject('permission_denied');
        const parsed = transitionPayloadSchema.safeParse(m.payload);
        if (!parsed.success) return reject('validation_failed', parsed.error.issues.slice(0, 5));
        const outcome = await applyTransition(tx, {
          collection: def.key, docId: m.entityId,
          payload: parsed.data, actor: staffUser, mutationId: m.id,
        });
        switch (outcome.status) {
          case 'applied':
            await writeLedger('applied', outcome.rowVersion);
            return { id: m.id, status: 'acked', serverVersion: outcome.rowVersion };
          case 'step_already_actioned':
            return reject('step_already_actioned', undefined, outcome.serverRow);
          case 'not_found':
            return reject('not_found');
          case 'permission_denied':
            return reject('permission_denied');
          case 'validation_failed':
            return reject('validation_failed', outcome.detail);
        }
      }
    }
  });
}
