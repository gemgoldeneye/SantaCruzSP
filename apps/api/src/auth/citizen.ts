// Citizen identity: OTP register-or-login, sessions, and the requireCitizen guard.
// Same Redis-cookie mechanism as staff but a SEPARATE cookie (sp_csess) and a
// 'citizen' discriminator. One database per municipality — no tenant concept.
import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v7 as uuidv7 } from 'uuid';
import { citizenAccounts } from '@gelabs/sp/data';
import { withTenant, withTenantWrite } from '../db/tenant.js';
import { redis } from '../redis.js';
import { env } from '../env.js';
import { requestOtp, verifyOtp } from './otp.js';
import { audit } from '../audit.js';

export const CITIZEN_COOKIE = 'sp_csess';
const TTL = 30 * 24 * 60 * 60; // 30-day sliding

export interface CitizenIdentity {
  id: string;
  barangayId: string | null;
  mobile: string;
  name: string;
  residentId: string | null;
  verified: boolean;
  consentAt: string | null;
  consentVersion: string | null;
}

const key = (id: string) => `csess:${id}`;

async function createSession(c: CitizenIdentity): Promise<string> {
  const id = randomBytes(32).toString('base64url');
  await redis.set(key(id), JSON.stringify(c), 'EX', TTL);
  return id;
}
export async function getCitizenSession(id: string): Promise<CitizenIdentity | null> {
  const raw = await redis.get(key(id));
  if (!raw) return null;
  await redis.expire(key(id), TTL);
  try { return JSON.parse(raw) as CitizenIdentity; } catch { return null; }
}

declare module 'fastify' {
  interface FastifyRequest { citizen?: CitizenIdentity; citizenSessionId?: string; }
}

/** preHandler: requires a live citizen session. */
export async function requireCitizen(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = req.cookies[CITIZEN_COOKIE];
  const unsigned = raw ? req.unsignCookie(raw) : null;
  if (!unsigned?.valid || !unsigned.value) { await reply.code(401).send({ error: 'unauthenticated' }); return; }
  const c = await getCitizenSession(unsigned.value);
  if (!c) { await reply.code(401).send({ error: 'session_expired' }); return; }
  req.citizen = c;
  req.citizenSessionId = unsigned.value;
}

const normMobile = (m: string) => m.replace(/[^\d]/g, '').replace(/^63/, '0').slice(-11);

const requestSchema = z.object({ mobile: z.string().min(10).max(20) });
const verifySchema = z.object({
  mobile: z.string().min(10).max(20),
  code: z.string().min(4).max(8),
  name: z.string().min(1).max(120).optional(),       // required only for first-time registration
  consentVersion: z.string().max(40).optional(),
});

function toIdentity(row: typeof citizenAccounts.$inferSelect): CitizenIdentity {
  return {
    id: row.id, barangayId: row.barangayId, mobile: row.mobile,
    name: row.name, residentId: row.residentRef, verified: row.verified,
    consentAt: row.consentAt ? row.consentAt.toISOString().slice(0, 10) : null,
    consentVersion: row.consentVersion,
  };
}

export async function citizenAuthRoutes(app: FastifyInstance): Promise<void> {
  // Step 1 — request a code (always 200 to avoid leaking which mobiles exist).
  app.post('/auth/citizen/otp/request', async (req, reply) => {
    const body = requestSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'validation_failed' });
    const mobile = normMobile(body.data.mobile);
    try {
      const { devCode } = await requestOtp(mobile);
      return reply.send({ ok: true, ...(devCode ? { devCode } : {}) });
    } catch (e) {
      if ((e as { code?: string }).code === 'rate_limited') return reply.code(429).send({ error: 'rate_limited' });
      throw e;
    }
  });

  // Step 2 — verify + register-or-login.
  app.post('/auth/citizen/otp/verify', async (req, reply) => {
    const body = verifySchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'validation_failed' });
    const mobile = normMobile(body.data.mobile);

    if (!(await verifyOtp(mobile, body.data.code))) {
      return reply.code(401).send({ error: 'invalid_code' });
    }

    const identity = await withTenantWrite(async (tx) => {
      const existing = await tx.select().from(citizenAccounts).where(
        eq(citizenAccounts.mobile, mobile),
      ).limit(1);
      if (existing[0]) return toIdentity(existing[0]);

      if (!body.data.name) return null;
      const id = uuidv7();
      const inserted = await tx.insert(citizenAccounts).values({
        id, barangayId: null, mobile, name: body.data.name,
        verified: false, consentAt: new Date(), consentVersion: body.data.consentVersion ?? '2026-06-01',
      }).returning();
      await audit({ actorId: id, actorName: body.data.name, action: 'citizen.register', detail: { mobile } }, tx);
      return toIdentity(inserted[0]!);
    });

    if (!identity) return reply.code(409).send({ error: 'registration_needs_name' });

    const sessionId = await createSession(identity);
    await withTenant((tx) => audit({ actorId: identity.id, actorName: identity.name, action: 'citizen.login' }, tx));
    return reply
      .setCookie(CITIZEN_COOKIE, sessionId, { path: '/', httpOnly: true, sameSite: 'lax', secure: !env.isDev, signed: true })
      .send({ account: identity });
  });

  app.get('/auth/citizen/me', { preHandler: requireCitizen }, async (req) => {
    return { account: req.citizen };
  });

  app.post('/auth/citizen/logout', { preHandler: requireCitizen }, async (req, reply) => {
    if (req.citizenSessionId) await redis.del(key(req.citizenSessionId));
    return reply.clearCookie(CITIZEN_COOKIE, { path: '/' }).send({ ok: true });
  });
}
