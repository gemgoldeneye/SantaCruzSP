// Workflow state management. data.workflow_instances/_events are the
// authoritative, queryable mirror (Inbox = one indexed query); the document's
// doc.wf JSONB is kept in lockstep. The SERVER is the only component that
// persists transitions; clients act optimistically and this module arbitrates
// by step index.
import { and, eq } from 'drizzle-orm';
import {
  getWorkflow, can, isAttested, isSettled,
  type TransitionPayload, type User, type WorkflowInstance,
} from '@gelabs/sp/contracts';
import { documents, workflowInstances, workflowEvents } from '@gelabs/sp/data';
import type { TenantTx } from '../db/tenant.js';
import { logChange } from '../documents/changeLog.js';
import { audit } from '../audit.js';

/** Mirror a document's embedded wf into the relational tables (create path). */
export async function upsertInstanceFromDoc(
  tx: TenantTx, tenantId: string, collection: string, docId: string, wf: WorkflowInstance,
): Promise<void> {
  const def = getWorkflow(wf.def);
  const completed = def ? wf.current >= def.steps.length : false;
  const currentOffice = def && !completed ? def.steps[wf.current]?.office ?? null : null;
  await tx.insert(workflowInstances).values({
    tenantId, collection, docId, defKey: wf.def,
    currentStep: wf.current, completed, currentOffice,
  }).onConflictDoUpdate({
    target: [workflowInstances.tenantId, workflowInstances.collection, workflowInstances.docId],
    set: { currentStep: wf.current, completed, currentOffice, updatedAt: new Date() },
  });
}

export type TransitionOutcome =
  | { status: 'applied'; rowVersion: number; doc: unknown }
  | { status: 'step_already_actioned'; serverRow: unknown }
  | { status: 'not_found' }
  | { status: 'permission_denied' }
  | { status: 'validation_failed'; detail: string };

/**
 * Apply one workflow transition atomically: documents.doc.wf + workflow tables +
 * change_log + audit. `fromIndex` is the arbitration point.
 */
export async function applyTransition(
  tx: TenantTx,
  args: {
    tenantId: string; collection: string; docId: string;
    payload: TransitionPayload; actor: User; mutationId?: string;
  },
): Promise<TransitionOutcome> {
  const { tenantId, collection, docId, payload, actor } = args;

  const rows = await tx.select().from(documents).where(and(
    eq(documents.tenantId, tenantId), eq(documents.collection, collection), eq(documents.id, docId),
  )).limit(1);
  const row = rows[0];
  if (!row || row.deletedAt) return { status: 'not_found' };

  const doc = row.doc as Record<string, unknown>;
  const wf = doc.wf as WorkflowInstance | undefined;
  if (!wf || wf.def !== payload.def) return { status: 'validation_failed', detail: 'document has no matching workflow' };
  const def = getWorkflow(wf.def);
  if (!def) return { status: 'validation_failed', detail: `unknown workflow def: ${wf.def}` };

  // Arbitration: the client acted on fromIndex; apply iff that is still current.
  if (wf.current !== payload.fromIndex) {
    return { status: 'step_already_actioned', serverRow: { doc, rowVersion: row.rowVersion } };
  }
  const step = def.steps[wf.current];
  if (!step) return { status: 'validation_failed', detail: 'workflow already complete' };
  if (!can(actor, step.action, step.office)) return { status: 'permission_denied' };

  const decision = payload.event.decision;

  // Precondition gate: required external refs must be attested (and any payment
  // settled) before this step may ADVANCE. Pure data check — never an external call.
  if (decision === 'approved') {
    for (const f of step.requiredRefs ?? []) {
      const ref = (doc as Record<string, unknown>)[f];
      const ok = f === 'payment' ? isSettled(ref) : isAttested(ref);
      if (!ok) return { status: 'validation_failed', detail: `${f} must be attested before '${step.key}'` };
    }
  }
  const expectedTo = decision === 'approved' ? wf.current + 1 : Math.max(0, wf.current - 1);
  if (payload.toIndex !== expectedTo) return { status: 'validation_failed', detail: 'toIndex does not follow from fromIndex' };

  const nextWf: WorkflowInstance = { ...wf, current: expectedTo, history: [...wf.history, payload.event] };
  const completed = expectedTo >= def.steps.length;
  const nextDoc = { ...doc, wf: nextWf };

  const updated = await tx.update(documents).set({
    doc: nextDoc, rowVersion: row.rowVersion + 1, updatedAt: new Date(), updatedBy: actor.id,
  }).where(and(
    eq(documents.tenantId, tenantId), eq(documents.collection, collection), eq(documents.id, docId),
  )).returning();
  const newRow = updated[0]!;

  await tx.update(workflowInstances).set({
    currentStep: expectedTo, completed,
    currentOffice: completed ? null : def.steps[expectedTo]?.office ?? null,
    updatedAt: new Date(),
  }).where(and(
    eq(workflowInstances.tenantId, tenantId),
    eq(workflowInstances.collection, collection),
    eq(workflowInstances.docId, docId),
  ));

  await tx.insert(workflowEvents).values({
    tenantId, collection, docId,
    stepKey: step.key, decision,
    actorId: actor.id, actorName: payload.event.actor, actorRole: payload.event.role ?? null,
    remarks: payload.event.remarks ?? null,
  });

  await logChange(tx, {
    tenantId, collection, docId, op: 'transition', rowVersion: newRow.rowVersion,
    ...(args.mutationId !== undefined ? { mutationId: args.mutationId } : {}),
  });
  await audit({
    tenantId, actorId: actor.id, actorName: actor.name, actorRole: actor.role,
    action: decision === 'approved' ? 'wf.advance' : 'wf.return',
    collection, docId,
    detail: { step: step.key, remarks: payload.event.remarks ?? null },
    ...(args.mutationId !== undefined ? { mutationId: args.mutationId } : {}),
  }, tx);

  return { status: 'applied', rowVersion: newRow.rowVersion, doc: nextDoc };
}
