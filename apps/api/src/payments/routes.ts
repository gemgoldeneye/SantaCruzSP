// LGU payment-gateway webhook. The gateway (not the client) asserts settlement;
// the webhook is HMAC-signed and idempotent. It settles the Order of Payment
// document: appends the payment, flips status to 'paid', stamps the payment attest.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { documents } from '@gelabs/sp/data';
import { withTenantWrite } from '../db/tenant.js';
import { logChange } from '../documents/changeLog.js';
import { mirrorPromoted } from '../sync/promote.js';
import { getCollection } from '@gelabs/sp/contracts';
import { audit } from '../audit.js';
import { env } from '../env.js';

const ORDER_COLLECTION = 'sp.treasury.orders';

const webhookSchema = z.object({
  orderId: z.string().uuid(),
  gatewayRef: z.string().min(1),
  method: z.enum(['gcash', 'maya', 'card', 'bank']),
  amount: z.number().int().nonnegative(),
  orNo: z.string().optional(),
  paymentId: z.string().uuid(),
});

function verifySignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', env.payment.webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  // Capture the raw body for HMAC verification.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try { done(null, { raw: body as string, json: JSON.parse(body as string) }); }
    catch (e) { done(e as Error); }
  });

  app.post('/api/payments/webhook', async (req, reply) => {
    const wrapped = req.body as { raw: string; json: unknown };
    if (!verifySignature(wrapped.raw, req.headers['x-signature'] as string | undefined)) {
      return reply.code(401).send({ error: 'bad_signature' });
    }
    const parsed = webhookSchema.safeParse(wrapped.json);
    if (!parsed.success) return reply.code(400).send({ error: 'validation_failed' });
    const { orderId, method, amount, orNo, paymentId, gatewayRef } = parsed.data;
    const def = getCollection(ORDER_COLLECTION)!;
    const settledAt = new Date().toISOString();

    const result = await withTenantWrite(async (tx) => {
      const rows = await tx.select().from(documents).where(and(
        eq(documents.collection, ORDER_COLLECTION), eq(documents.id, orderId),
      )).limit(1);
      const row = rows[0];
      if (!row || row.deletedAt) return { ok: false as const, code: 404 };

      const doc = row.doc as Record<string, unknown>;
      const existingPayments = Array.isArray(doc.payments) ? (doc.payments as Array<{ id: string }>) : [];
      // Idempotent: a replayed webhook for the same paymentId is a no-op ack.
      if (existingPayments.some((p) => p.id === paymentId)) return { ok: true as const, duplicate: true };

      const nextDoc = {
        ...doc,
        status: 'paid',
        paidAt: settledAt,
        payments: [...existingPayments, { id: paymentId, method, orNo: orNo ?? null, amount, status: 'paid', at: settledAt }],
        payment: { provider: 'lgu_pay', value: gatewayRef, source: 'gateway', settledAt },
      };
      const updated = await tx.update(documents).set({
        doc: nextDoc, rowVersion: row.rowVersion + 1, updatedAt: new Date(),
      }).where(and(
        eq(documents.collection, ORDER_COLLECTION), eq(documents.id, orderId),
      )).returning();
      const newRow = updated[0]!;
      await mirrorPromoted(tx, def, orderId, nextDoc);
      await logChange(tx, { collection: ORDER_COLLECTION, docId: orderId, op: 'update', rowVersion: newRow.rowVersion, origin: 'gateway' });
      await audit({ actorName: 'lgu_pay gateway', action: 'payment.settled', collection: ORDER_COLLECTION, docId: orderId, detail: { gatewayRef, amount } }, tx);
      return { ok: true as const, rowVersion: newRow.rowVersion };
    });

    if (!result.ok) return reply.code(result.code).send({ error: 'order_not_found' });
    return { ok: true, ...(('duplicate' in result) ? { duplicate: result.duplicate } : {}) };
  });
}
