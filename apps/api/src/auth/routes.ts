// Staff auth routes: login / logout / me.
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { z } from 'zod';
import type { Bilingual, Membership, OfficeRoleKey, RoleKey, User } from '@gelabs/sp/contracts';
import { db } from '../db/client.js';
import { users, memberships, roles } from '@gelabs/sp/data';
import { env } from '../env.js';
import { createSession, destroySession, SESSION_COOKIE } from './session.js';
import { requireUser } from './guard.js';
import { audit, type AuditInput } from '../audit.js';
import { withTenant } from '../db/tenant.js';

// audit appends to the hash chain inside a transaction (fixed advisory lock).
const auditTx = (input: AuditInput) => withTenant((tx) => audit(input, tx));

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
});

function toUser(
  row: typeof users.$inferSelect,
  mems: { office: string; officeRole: string }[],
  permissions: string[],
): User {
  const user: User = {
    id: row.id,
    name: row.name,
    role: row.role as RoleKey,
    title: (row.title ?? { fil: '', en: '' }) as Bilingual,
    offices: row.offices,
    initials: row.initials,
  };
  if (mems.length > 0) {
    user.memberships = mems.map((m): Membership => ({ office: m.office, officeRole: m.officeRole as OfficeRoleKey }));
  }
  if (permissions.length > 0) user.permissions = permissions;
  if (row.barangayId) user.scope = { barangay: row.barangayId };
  return user;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/staff/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'validation_failed' });

    const row = await db.query.users.findFirst({
      where: eq(users.username, body.data.username),
    });
    // Verify against a constant-cost dummy hash when the user is unknown so
    // username probing and a wrong password take the same time.
    const hash = row?.passwordHash ?? DUMMY_HASH;
    const ok = await argonVerify(hash, body.data.password).catch(() => false);
    if (!row || !ok || row.status !== 'active') {
      await auditTx({ actorName: body.data.username, action: 'auth.fail' });
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const mems = await db.select().from(memberships).where(eq(memberships.userId, row.id));
    const role = row.roleId
      ? await db.query.roles.findFirst({ where: eq(roles.id, row.roleId) })
      : null;
    const user = toUser(row, mems, role?.permissions ?? []);
    const sessionId = await createSession({ userId: row.id, user });

    await auditTx({ actorId: row.id, actorName: row.name, actorRole: row.role, action: 'auth.login' });
    return reply
      .setCookie(SESSION_COOKIE, sessionId, {
        path: '/', httpOnly: true, sameSite: 'lax', secure: !env.isDev, signed: true,
      })
      .send({ user });
  });

  app.post('/auth/staff/logout', { preHandler: requireUser }, async (req, reply) => {
    if (req.sessionId) await destroySession(req.sessionId);
    return reply.clearCookie(SESSION_COOKIE, { path: '/' }).send({ ok: true });
  });

  app.get('/auth/me', { preHandler: requireUser }, async (req) => {
    return { user: req.user };
  });

  // Self-service change-password: any signed-in user rotates their OWN password
  // (verify current, set new). Admin-initiated resets go through /api/admin/accounts.
  app.post('/auth/password', { preHandler: requireUser }, async (req, reply) => {
    const body = passwordSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'validation_failed' });
    const row = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    const ok = await argonVerify(row.passwordHash, body.data.currentPassword).catch(() => false);
    if (!ok) return reply.code(403).send({ error: 'wrong_password' });
    await db.update(users)
      .set({ passwordHash: await argonHash(body.data.newPassword) })
      .where(eq(users.id, row.id));
    await auditTx({ actorId: row.id, actorName: row.name, actorRole: row.role, action: 'auth.password_change' });
    return reply.send({ ok: true });
  });
}

// argon2id hash of a random value — used only to equalize login timing.
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$qLml5cbqFAO6YxVHhrSonNyTm1+CLbqyO5IAB6oP2nM';
