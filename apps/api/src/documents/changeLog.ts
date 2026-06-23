// change_log writer — MUST be called inside the same transaction as the
// document write so the pull cursor never observes a half-applied change.
import { changeLog } from '@gelabs/sp/data';
import type { TenantTx } from '../db/tenant.js';

export interface ChangeInput {
  tenantId: string;
  collection: string;
  docId: string;
  op: 'create' | 'update' | 'delete' | 'append' | 'transition';
  rowVersion: number;
  origin?: string;
  mutationId?: string;
}

export async function logChange(tx: TenantTx, input: ChangeInput): Promise<void> {
  await tx.insert(changeLog).values({
    tenantId: input.tenantId,
    collection: input.collection,
    docId: input.docId,
    op: input.op,
    rowVersion: input.rowVersion,
    origin: input.origin ?? 'local',
    mutationId: input.mutationId ?? null,
  });
}
