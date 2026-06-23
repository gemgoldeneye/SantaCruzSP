// Thin fetch client for the server-authoritative surfaces that BYPASS the sync
// layer: auth, admin (users/roles), reports/analytics. Always credentials:'include'
// so the session cookie rides along; the SW marks these NetworkOnly.
import type { User } from '@gelabs/sp/contracts';

const API_BASE = ''; // same-origin: the Next app proxies /api + /auth to the Fastify api (next.config rewrites)

/** Same-shape `fetch` for the admin managers (ported legacy components call this in
 *  place of relative fetch): prefixes the API origin + always sends the cookie. */
export function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { credentials: 'include', ...init });
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}

export interface MeResponse { user: User; tenantId: string }
export interface AnalyticsResponse {
  docsByStage: { stage: string; count: number }[];
  mtopByStatus: { status: string; count: number }[];
  appsByStage: { stage: string; count: number }[];
  revenue: number;
  totals: { documents: number; sessions: number; feedback: number };
}
export interface NotificationRow {
  seq: number; at: string; actorName: string; actorRole: string | null;
  action: string; collection: string | null; docId: string | null;
  title: string | null; ref: string | null; applicantName: string | null;
}

export const api = {
  login: (username: string, password: string) =>
    req<MeResponse>('/auth/staff/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => req<{ ok: boolean }>('/auth/staff/logout', { method: 'POST' }),
  me: () => req<MeResponse>('/auth/me'),
  notifications: (limit = 40) => req<NotificationRow[]>(`/api/notifications?limit=${limit}`),
  analytics: () => req<AnalyticsResponse>('/api/reports/analytics'),
  inbox: () => req<{ items: unknown[] }>('/api/inbox'),
  leaseRefs: (collection: string, series: string, deviceId: string, count = 50) =>
    req<{ series: string; start: number; end: number }>('/api/refs/lease', {
      method: 'POST', body: JSON.stringify({ collection, series, count, deviceId }),
    }),
};
