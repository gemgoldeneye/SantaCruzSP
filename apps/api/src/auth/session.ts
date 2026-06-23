// Staff sessions — httpOnly cookie + Redis-backed server state (NOT JWT).
// Revocation is instant: delete the Redis key. 12h sliding TTL.
import { randomBytes } from 'node:crypto';
import type { User } from '@gelabs/sp/contracts';
import { redis } from '../redis.js';

export const SESSION_COOKIE = 'sp_sess';
const TTL_SECONDS = 12 * 60 * 60;

export interface SessionData {
  userId: string;
  tenantId: string;
  user: User;
}

const key = (id: string) => `sess:${id}`;

export async function createSession(data: SessionData): Promise<string> {
  const id = randomBytes(32).toString('base64url');
  await redis.set(key(id), JSON.stringify(data), 'EX', TTL_SECONDS);
  return id;
}

export async function getSession(id: string): Promise<SessionData | null> {
  const raw = await redis.get(key(id));
  if (!raw) return null;
  await redis.expire(key(id), TTL_SECONDS); // sliding
  try { return JSON.parse(raw) as SessionData; } catch { return null; }
}

export async function destroySession(id: string): Promise<void> {
  await redis.del(key(id));
}
