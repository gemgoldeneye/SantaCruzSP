// Request guards — authentication + the server-side RBAC gate. `can()` is the
// SAME matrix the frontend renders, enforced here authoritatively.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { can, type PermissionAction, type User } from '@gelabs/sp/contracts';
import { getSession, SESSION_COOKIE } from './session.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    sessionId?: string;
  }
}

/** preHandler: requires a live session; populates request.user. */
export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) { await reply.code(401).send({ error: 'unauthenticated' }); return; }
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) { await reply.code(401).send({ error: 'unauthenticated' }); return; }
  const session = await getSession(unsigned.value);
  if (!session) { await reply.code(401).send({ error: 'session_expired' }); return; }
  req.user = session.user;
  req.sessionId = unsigned.value;
}

/** 403 unless the user holds `action` in `office` (exec sentinel passes). */
export function assertCan(req: FastifyRequest, reply: FastifyReply, action: PermissionAction, office: string): boolean {
  if (!req.user) { void reply.code(401).send({ error: 'unauthenticated' }); return false; }
  if (!can(req.user, action, office)) {
    void reply.code(403).send({ error: 'permission_denied', action, office });
    return false;
  }
  return true;
}
