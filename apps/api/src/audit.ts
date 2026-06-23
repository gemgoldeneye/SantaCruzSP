// Append-only, hash-chained audit log (RA 10173 + COA tamper evidence).
// Each event's hash = sha256(prevHash ‖ canonical event content). Inside a
// transaction, pg_advisory_xact_lock serializes chain appends per tenant.
import { createHash } from 'node:crypto';
import { sql as rawSql } from 'drizzle-orm';
import { db } from './db/client.js';
import { auditEvents } from '@gelabs/sp/data';

export interface AuditInput {
  tenantId: string;
  actorId?: string;
  actorName: string;
  actorRole?: string;
  action: string;
  collection?: string;
  docId?: string;
  detail?: unknown;
  mutationId?: string;
}

type DbLike = Pick<typeof db, 'execute' | 'insert'>;

export async function audit(input: AuditInput, tx: DbLike = db): Promise<void> {
  await tx.execute(rawSql`SELECT pg_advisory_xact_lock(hashtext(${input.tenantId}))`);
  const prev = (await tx.execute(rawSql`
    SELECT hash FROM platform.audit_events
    WHERE tenant_id = ${input.tenantId}
    ORDER BY seq DESC LIMIT 1
  `)) as unknown as { hash: string }[];
  const prevHash = prev[0]?.hash ?? null;

  const content = JSON.stringify({
    tenantId: input.tenantId, actorId: input.actorId ?? null, actorName: input.actorName,
    actorRole: input.actorRole ?? null, action: input.action, collection: input.collection ?? null,
    docId: input.docId ?? null, detail: input.detail ?? null, mutationId: input.mutationId ?? null,
  });
  const hash = createHash('sha256').update(prevHash ?? '').update(content).digest('hex');

  await tx.insert(auditEvents).values({
    tenantId: input.tenantId,
    actorId: input.actorId ?? null,
    actorName: input.actorName,
    actorRole: input.actorRole ?? null,
    action: input.action,
    collection: input.collection ?? null,
    docId: input.docId ?? null,
    detail: input.detail ?? null,
    mutationId: input.mutationId ?? null,
    prevHash,
    hash,
  });
}
