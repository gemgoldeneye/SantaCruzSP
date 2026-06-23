// Promoted relational mirrors. The JSONB document in data.documents stays
// authoritative; these tables give ZambalesSP the relational guarantees tanglaw's
// pure-document model can't: vote uniqueness, the COA money trail, and an atomic
// zone-capacity counter. Mirroring runs inside the same tenant write-transaction
// as the document write, so the relational copy can never diverge.
import { and, eq } from 'drizzle-orm';
import type { CollectionDef } from '@gelabs/sp/contracts';
import { paymentOrders, payments, voteRecords, zoneCounters } from '@gelabs/sp/data';
import type { TenantTx } from '../db/tenant.js';

interface VoteTally { yes?: number; no?: number; abstain?: number; absent?: number; date?: string }
interface PaymentRow { id: string; method: 'gcash' | 'maya' | 'card' | 'bank'; orNo?: string; amount: number; status: 'pending' | 'paid' | 'failed' }

export async function mirrorPromoted(
  tx: TenantTx, tenantId: string, def: CollectionDef, docId: string, doc: Record<string, unknown>,
): Promise<void> {
  if (!def.promoted) return;

  switch (def.key) {
    // ── Legislative votes — one row per (doc, stage); re-vote overwrites ──────
    case 'sp.sanggunian.documents': {
      const votes = (doc.votes ?? {}) as Record<string, VoteTally>;
      for (const [stage, tally] of Object.entries(votes)) {
        await tx.insert(voteRecords).values({
          tenantId, docId, stage,
          yes: tally.yes ?? 0, no: tally.no ?? 0, abstain: tally.abstain ?? 0, absent: tally.absent ?? 0,
          date: tally.date ?? null,
        }).onConflictDoUpdate({
          target: [voteRecords.tenantId, voteRecords.docId, voteRecords.stage],
          set: {
            yes: tally.yes ?? 0, no: tally.no ?? 0, abstain: tally.abstain ?? 0, absent: tally.absent ?? 0,
            date: tally.date ?? null, updatedAt: new Date(),
          },
        });
      }
      return;
    }

    // ── Order of Payment + its settlements (the money trail) ──────────────────
    case 'sp.treasury.orders': {
      const ref = typeof doc.ref === 'string' ? doc.ref : null;
      const applicationRef = String(doc.applicationRef ?? '');
      const total = Number(doc.totalAmount ?? 0);
      const status = doc.status === 'paid' ? 'paid' : 'pending';
      const paidAt = typeof doc.paidAt === 'string' ? new Date(doc.paidAt) : null;
      if (applicationRef) {
        await tx.insert(paymentOrders).values({
          tenantId, id: docId, ref, applicationRef, totalAmount: total, status, paidAt,
        }).onConflictDoUpdate({
          target: [paymentOrders.tenantId, paymentOrders.id],
          set: { ref, totalAmount: total, status, paidAt },
        });
      }
      const rows = (doc.payments ?? []) as PaymentRow[];
      for (const p of rows) {
        if (!p.id) continue;
        await tx.insert(payments).values({
          tenantId, id: p.id, orderId: docId, method: p.method,
          orNo: p.orNo ?? null, amount: Number(p.amount ?? 0), status: p.status,
        }).onConflictDoUpdate({
          target: [payments.tenantId, payments.id],
          set: { orNo: p.orNo ?? null, amount: Number(p.amount ?? 0), status: p.status },
        });
      }
      return;
    }

    // ── Zone capacity counter (authoritative `used`) ──────────────────────────
    case 'sp.mtop.zones': {
      const used = Number(doc.used ?? 0);
      await tx.insert(zoneCounters).values({ tenantId, zoneId: docId, used })
        .onConflictDoUpdate({
          target: [zoneCounters.tenantId, zoneCounters.zoneId],
          set: { used, updatedAt: new Date() },
        });
      return;
    }

    default:
      return; // promoted but status-surface only (applications, mtops)
  }
}

/** Read the live zone counter (for capacity checks in the prangkisa UI/API). */
export async function zoneUsage(tx: TenantTx, tenantId: string, zoneId: string): Promise<number> {
  const rows = await tx.select().from(zoneCounters).where(and(
    eq(zoneCounters.tenantId, tenantId), eq(zoneCounters.zoneId, zoneId),
  )).limit(1);
  return rows[0]?.used ?? 0;
}
