// Public + citizen-auth fetch client. Transparency reads are public (no session);
// OTP auth establishes a citizen session cookie used by the sync layer for feedback.
const API_BASE = ''; // same-origin: the Next app proxies /api + /auth to the Fastify api (next.config rewrites)

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

export interface Project { id: string; name: string; municipality: string; status: string; budget: number }
export interface Ordinance { id: string; ref: string; title: string; type: string; year: number; summary: string }
export interface VerifyResult { found: boolean; no?: string; status?: string; operator?: string; unit?: string; validTo?: string; zone?: string; toda?: string }
export interface CitizenAccount { id: string; name: string; mobile: string; verified: boolean }

export const api = {
  projects: () => req<{ projects: Project[] }>('/api/public/projects'),
  ordinances: () => req<{ ordinances: Ordinance[] }>('/api/public/ordinances'),
  verify: (no: string) => req<VerifyResult>(`/api/prangkisa/verify?no=${encodeURIComponent(no)}`),
  otpRequest: (mobile: string) => req<{ ok: boolean; devCode?: string }>('/auth/citizen/otp/request', { method: 'POST', body: JSON.stringify({ mobile }) }),
  otpVerify: (mobile: string, code: string, name?: string) =>
    req<{ account: CitizenAccount }>('/auth/citizen/otp/verify', { method: 'POST', body: JSON.stringify({ mobile, code, name }) }),
  me: () => req<{ account: CitizenAccount }>('/auth/citizen/me'),
  logout: () => req<{ ok: boolean }>('/auth/citizen/logout', { method: 'POST' }),
};
