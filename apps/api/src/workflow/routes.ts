// Online workflow endpoints + the cross-office Inbox.
//   POST /api/c/:collection/:id/workflow/advance|return   { remarks? }
//   GET  /api/inbox                                       steps awaiting this user
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { and, eq, inArray } from 'drizzle-orm';
import {
  can, getCollection, getWorkflow, officeRole,
  type TransitionPayload, type WorkflowInstance,
} from '@gelabs/sp/contracts';
import { documents, workflowInstances } from '@gelabs/sp/data';
import { withTenant, withTenantWrite } from '../db/tenant.js';
import { requireUser } from '../auth/guard.js';
import { applyTransition } from './service.js';
import { rowToDto } from '../documents/routes.js';

interface DocParams { collection: string; id: string }

async function transitionHandler(
  req: FastifyRequest, reply: FastifyReply, decision: 'approved' | 'returned',
): Promise<unknown> {
  const { collection, id } = req.params as DocParams;
  const def = getCollection(collection);
  if (!def) return reply.code(404).send({ error: 'unknown_collection' });
  const remarks = (req.body as { remarks?: string } | null)?.remarks;
  const user = req.user!;

  const outcome = await withTenantWrite(req.tenantId!, async (tx) => {
    const rows = await tx.select().from(documents).where(and(
      eq(documents.tenantId, req.tenantId!), eq(documents.collection, def.key), eq(documents.id, id),
    )).limit(1);
    const row = rows[0];
    if (!row || row.deletedAt) return { status: 'not_found' as const };
    const wf = (row.doc as Record<string, unknown>).wf as WorkflowInstance | undefined;
    if (!wf) return { status: 'validation_failed' as const, detail: 'document has no workflow' };
    const wdef = getWorkflow(wf.def);
    const step = wdef?.steps[wf.current];
    if (!wdef || !step) return { status: 'validation_failed' as const, detail: 'workflow complete or unknown' };

    const payload: TransitionPayload = {
      def: wf.def,
      fromIndex: wf.current,
      toIndex: decision === 'approved' ? wf.current + 1 : Math.max(0, wf.current - 1),
      event: {
        step: step.key, decision, actor: user.name,
        role: officeRole(user, step.office) ?? user.role,
        at: new Date().toISOString(),
        ...(remarks !== undefined ? { remarks } : {}),
      },
    };
    return applyTransition(tx, { tenantId: req.tenantId!, collection: def.key, docId: id, payload, actor: user });
  });

  switch (outcome.status) {
    case 'applied': return { doc: outcome.doc, rowVersion: outcome.rowVersion };
    case 'not_found': return reply.code(404).send({ error: 'not_found' });
    case 'permission_denied': return reply.code(403).send({ error: 'permission_denied' });
    case 'step_already_actioned': return reply.code(409).send({ error: 'step_already_actioned', serverRow: outcome.serverRow });
    case 'validation_failed': return reply.code(400).send({ error: 'validation_failed', detail: outcome.detail });
  }
}

export async function workflowRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUser);

  app.post('/api/c/:collection/:id/workflow/advance', (req, reply) => transitionHandler(req, reply, 'approved'));
  app.post('/api/c/:collection/:id/workflow/return', (req, reply) => transitionHandler(req, reply, 'returned'));

  /** Pending workflow steps the current user can act on, across all offices. */
  app.get('/api/inbox', async (req) => {
    const user = req.user!;
    return withTenant(req.tenantId!, async (tx) => {
      const pending = await tx.select().from(workflowInstances).where(and(
        eq(workflowInstances.tenantId, req.tenantId!),
        eq(workflowInstances.completed, false),
      )).limit(1000);

      const actionable = pending.filter((p) => {
        const wdef = getWorkflow(p.defKey);
        const step = wdef?.steps[p.currentStep];
        if (!step || !getCollection(p.collection)) return false;
        return can(user, step.action, step.office);
      });

      const byCollection = new Map<string, string[]>();
      for (const p of actionable) {
        const list = byCollection.get(p.collection) ?? [];
        list.push(p.docId);
        byCollection.set(p.collection, list);
      }
      const docRows = (await Promise.all([...byCollection.entries()].map(([coll, ids]) =>
        tx.select().from(documents).where(and(
          eq(documents.tenantId, req.tenantId!), eq(documents.collection, coll), inArray(documents.id, ids),
        )),
      ))).flat();
      const docByKey = new Map(docRows.map((d) => [`${d.collection} ${d.id}`, d]));

      const items = actionable.flatMap((p) => {
        const wdef = getWorkflow(p.defKey)!;
        const step = wdef.steps[p.currentStep]!;
        const d = docByKey.get(`${p.collection} ${p.docId}`);
        if (!d || d.deletedAt) return [];
        return [{
          collection: p.collection, docId: p.docId, def: p.defKey,
          stepKey: step.key, stepLabel: step.label, office: step.office,
          action: step.action, row: rowToDto(d),
        }];
      });
      return { items };
    });
  });
}
