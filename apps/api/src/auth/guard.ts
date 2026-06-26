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

/** preHandler: requires a live session; populates request.user.
 *  A present-but-dead cookie (bad signature / expired/destroyed session) is
 *  CLEARED on the 401: the edge proxy redirects on cookie PRESENCE only, so a
 *  stale-but-present cookie would otherwise trap the user in a /login ↔ /
 *  redirect loop they can't escape (logout needs a live session). Clearing it
 *  here lets the very next /auth/me strip the dead cookie via Set-Cookie. */
export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) { await reply.code(401).send({ error: 'unauthenticated' }); return; }
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) {
    await reply.clearCookie(SESSION_COOKIE, { path: '/' }).code(401).send({ error: 'unauthenticated' });
    return;
  }
  const session = await getSession(unsigned.value);
  if (!session) {
    await reply.clearCookie(SESSION_COOKIE, { path: '/' }).code(401).send({ error: 'session_expired' });
    return;
  }
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
