#!/usr/bin/env node
// Live wireup smoke test — pokes every server surface the staff app depends on and
// prints a ✓ / ✗ checklist of what is actually wired up end to end. Run it against
// a running stack (pnpm db:up && pnpm dev:api) to see "kung ano pa ang hindi naka-wireup".
//
//   node apps/api/scripts/smoke.mjs            (defaults to http://localhost:8787)
//   API_BASE=http://host:8787 SMOKE_USER=admin@iba.gov.ph SMOKE_PASS=demo1234 node apps/api/scripts/smoke.mjs
//
// Exit 0 = everything wired · 1 = a wired surface failed · 2 = API unreachable.
import { randomUUID } from 'node:crypto';

const BASE = process.env.API_BASE ?? 'http://localhost:8787';
const USER = process.env.SMOKE_USER ?? 'admin@iba.gov.ph';
const PASS = process.env.SMOKE_PASS ?? 'demo1234';
const DEVICE = 'smoke-' + randomUUID().slice(0, 8);

const GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', YEL = '\x1b[33m', RESET = '\x1b[0m';
const results = [];
let cookie = '';

/** Accumulate Set-Cookie from a response into the jar (name=value only). */
function captureCookies(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  const pairs = set.map((c) => c.split(';')[0]).filter(Boolean);
  if (pairs.length) cookie = pairs.join('; ');
}

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  captureCookies(res);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, ok: res.ok, json };
}

/** Run one named check; record pass/fail without throwing. */
async function check(name, fn) {
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note ?? '' });
    console.log(`${GREEN}✓${RESET} ${name}${note ? `  ${DIM}${note}${RESET}` : ''}`);
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message ?? e) });
    console.log(`${RED}✗${RESET} ${name}  ${RED}${String(e.message ?? e)}${RESET}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

console.log(`${DIM}Smoke testing ${BASE} as ${USER}${RESET}\n`);

// ── 0. Reachability + health ────────────────────────────────────────────────
let health;
try {
  health = await http('GET', '/healthz');
} catch (e) {
  console.log(`${RED}✗ API unreachable at ${BASE}${RESET} — ${e.message}`);
  console.log(`${YEL}  Start the stack first: pnpm db:up && pnpm dev:api${RESET}`);
  process.exit(2);
}

await check('Health check (db + redis)', () => {
  assert(health.ok, `healthz returned ${health.status}`);
  assert(health.json?.db, 'database not reachable');
  assert(health.json?.redis, 'redis not reachable');
  return `role=${health.json?.role}`;
});

// ── 1. Staff auth ───────────────────────────────────────────────────────────
let me = null;
await check('Staff login + session cookie', async () => {
  const r = await http('POST', '/auth/staff/login', { username: USER, password: PASS });
  assert(r.ok, `login failed (${r.status}) — set SMOKE_USER / SMOKE_PASS`);
  assert(cookie, 'no session cookie was set');
  me = r.json?.user;
  assert(me?.id, 'login response had no user');
  return `${me?.name} · ${me?.role}`;
});

await check('Whoami (/auth/me)', async () => {
  const r = await http('GET', '/auth/me');
  assert(r.ok && r.json?.user?.id, `me returned ${r.status}`);
});

// ── 2. Admin surfaces (Accounts, Roles) ─────────────────────────────────────
await check('Roles list (/api/admin/roles)', async () => {
  const r = await http('GET', '/api/admin/roles');
  assert(r.ok, `roles returned ${r.status}`);
  assert(Array.isArray(r.json), 'roles response is not a list');
  const hasSessionsPerm = r.json.some((role) => (role.permissions ?? []).includes('sessions:manage'));
  return `${r.json.length} roles${hasSessionsPerm ? ' · sessions:manage in use' : ''}`;
});

await check('Accounts list (/api/admin/accounts)', async () => {
  const r = await http('GET', '/api/admin/accounts');
  assert(r.ok, `accounts returned ${r.status}`);
  assert(Array.isArray(r.json), 'accounts response is not a list');
  return `${r.json.length} accounts`;
});

// ── 3. Activity Logs (NEW) ──────────────────────────────────────────────────
await check('Activity logs (/api/admin/audit)', async () => {
  const r = await http('GET', '/api/admin/audit?limit=5');
  assert(r.ok, `audit returned ${r.status} (endpoint not wired?)`);
  assert(Array.isArray(r.json), 'audit response is not a list');
  const login = r.json.find((e) => e.action === 'auth.login');
  return `${r.json.length} recent events${login ? ' · login captured' : ''}`;
});

// ── 4. Offline sync read path ───────────────────────────────────────────────
await check('Sync pull (/api/sync/pull)', async () => {
  const r = await http('GET', '/api/sync/pull?cursor=0');
  assert(r.ok, `pull returned ${r.status}`);
  assert(Array.isArray(r.json?.changes), 'pull response missing changes[]');
  return `${r.json.changes.length} changes`;
});

// ── 5. Sessions CRUD round-trip via sync push (create → delete) ─────────────
await check('Session create + delete (sync push → sp.sanggunian.sessions)', async () => {
  assert(me?.id, 'need a logged-in user');
  const docId = randomUUID();
  const session = {
    id: docId,
    title: `SMOKE TEST SESSION ${DEVICE}`,
    date: new Date().toISOString().slice(0, 10),
    mode: 'in_person',
    status: 'scheduled',
    agenda: [{ id: randomUUID(), order: 1, type: 'Call to Order', title: 'Call to Order' }],
  };
  const actor = { userId: me.id, deviceId: DEVICE };
  const create = await http('POST', '/api/sync/push', {
    deviceId: DEVICE,
    mutations: [{
      id: randomUUID(), collection: 'sp.sanggunian.sessions', entityId: docId,
      op: 'create', payload: session, baseVersion: null, actor, at: new Date().toISOString(),
    }],
  });
  assert(create.ok, `push returned ${create.status}`);
  const cres = create.json?.results?.[0];
  assert(cres?.status === 'acked' || cres?.status === 'duplicate',
    `create not accepted: ${cres?.status} ${cres?.code ?? ''} ${cres?.detail ?? ''}`);
  const version = cres.serverVersion ?? 1;

  // Clean up so repeated smoke runs do not accumulate test sessions.
  const del = await http('POST', '/api/sync/push', {
    deviceId: DEVICE,
    mutations: [{
      id: randomUUID(), collection: 'sp.sanggunian.sessions', entityId: docId,
      op: 'delete', payload: null, baseVersion: version, actor, at: new Date().toISOString(),
    }],
  });
  const dres = del.json?.results?.[0];
  assert(dres?.status === 'acked', `delete not accepted: ${dres?.status} ${dres?.code ?? ''}`);
  return 'create + delete acked';
});

// ── Summary ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log('');
if (failed.length === 0) {
  console.log(`${GREEN}All ${results.length} surfaces wired up.${RESET}`);
  process.exit(0);
} else {
  console.log(`${RED}${failed.length} of ${results.length} checks failed — NOT fully wired:${RESET}`);
  for (const f of failed) console.log(`  ${RED}✗ ${f.name}${RESET} — ${f.note}`);
  process.exit(1);
}
