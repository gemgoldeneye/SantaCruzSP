# Santa Cruz Sanggunian — Governance Platform (Zambales)

The **Santa Cruz, Zambales** deployment of the **`@gelabs/sp`** SDK — an offline-first, federated
Sangguniang (SP) governance platform: legislative e-archive + sessions + voting, tricycle
franchising (MTOP/Prangkisa), a public citizen portal, and client-side OCR. This repo is a thin
per-LGU **consumer**: it **configures + connects**; it does not fork the platform code.

> The pre-SDK Next.js app is preserved under [`legacy/web`](./legacy/web) (reference only).
> See [`project.md`](./project.md) for domain context.

## Architecture

A **pnpm monorepo** (Node ≥ 22) that consumes the `@gelabs/sp` umbrella:

```
apps/
  web/         Next.js 16 (App Router) — ONE app: the offline-first staff console (`/`,
                             client-rendered + Dexie/sync-client) + the public citizen portal
                             (`/portal`, SSR + client islands). Same-origin rewrite proxy
                             (`/api`, `/auth`, `/healthz`) → the Fastify api. Serwist PWA.
  api/         @sp/api      — Fastify 5 booting defineSpRuntime(config) from @gelabs/sp:
                             document store + offline sync + workflow + multi-tenant RLS +
                             federation node pump.
config/
  iba/         @lgu/santacruz     — the per-LGU config: ONE defineSpConfig({...}) (identity, theme,
                             offices, modules, MTOP zones/fees, bilingual copy, demo logins).
deploy/
  dev/         local Postgres 16 + Redis 7 (compose).
  cloud/       Zambales provincial HUB (federation).
  onprem/      Santa Cruz municipal NODE (federation over Tailscale).
```

**The SDK:** everything platform-wide (contracts, sync-client, the Drizzle data model, runtime,
UI, the config contract) comes from **`@gelabs/sp`** via its subpaths — `@gelabs/sp/runtime`,
`/data`, `/contracts`, `/modules`, `/sync-client`, `/sync-client/ui`, `/ui`, `/ui/client`,
`/config`. A central SDK fix propagates here on a version bump; no platform code lives in this repo.

> **SDK source:** `@gelabs/sp` is published to the private `gelabs` npm org (`access: restricted`).
> All three workspace packages (apps/web, apps/api, config/santacruz) depend on `@gelabs/sp@^0.1.0`;
> installing the private package needs a read token (see Develop).

**Stack:** Next.js 16 (App Router) · Fastify · Drizzle ORM · PostgreSQL (RLS, two roles) · Redis
(sessions/OTP) · argon2 · Dexie (IndexedDB) · React 19 · Serwist (PWA) · zod 3 · tesseract.js (OCR).

### Key properties
- **Offline-first:** reads come from a reactive local Dexie cache; writes enqueue an outbox
  mutation (UUIDv7 = idempotency key) and sync in the background. Conflicts surface in an
  attention tray, never as failed requests.
- **Document store + promoted tables:** ~14 collections live as JSONB in `data.documents`; four
  are *promoted* to relational tables for integrity — `vote_records`, `payment_orders` +
  `payments` (COA money trail), `zone_counters` (atomic franchise capacity).
- **Multi-tenant RLS:** every row carries `tenant_id`; the runtime connects as the non-owner
  `zsp_app` role so RLS policies bite. Santa Cruz (`santacruz-zambales`) is a municipality tenant under the
  `zambales-province` hub.
- **Federation:** sync-class-gated node pump. Issued MTOPs, enacted ordinances, and projects
  project UP to the province (`up_projection`); applicant PII, payments, and feedback stay
  `local_only` and never leave the Santa Cruz node.
- **RBAC:** office membership × office-role × graded action, enforced server-side against the
  *recorded* actor (shared-desk safe). The same `can()` matrix renders the staff UI.

## Develop

Requires Docker (local dev only — provisions Postgres + Redis; **never** deploy this stack).
`@gelabs/sp` is a private package, so installing needs a read token — export an npm Automation
read token as `NPM_TOKEN` (the repo `.npmrc` reads it) before `pnpm install`.

```bash
pnpm install
pnpm db:up                       # Postgres (:5500) + Redis (:6400)
pnpm db:migrate                  # Drizzle migrations + RLS (runs as owner role)
pnpm db:seed                     # province + Santa Cruz tenants, demo staff, reference data
pnpm dev:api                     # @sp/api on :8787  (GET /healthz → {ok,db,redis})
pnpm dev:web                     # Next on :4000  (staff at /, citizen portal at /portal)
```

**Demo staff login:** `admin@santacruz.gov.ph` / `demo1234` (tenant `santacruz-zambales`).
Other demo accounts: `joan.ballesteros@santacruz.gov.ph` (Presiding Officer), `secretariat@santacruz.gov.ph`,
`mtop.clerk@santacruz.gov.ph` — all `demo1234`. **Citizen portal:** sign in with any mobile number;
the dev OTP is always `123456`.

## Make it your municipality

Everything Santa Cruz-specific lives in **`config/santacruz/src/index.ts`** (one `defineSpConfig({...})`,
validated against the SDK contract at load). Edit it (and the seal at `apps/web/public/iba-seal.svg`
+ the brand tokens in `apps/web/app/globals.css`) and the whole app re-themes + re-labels — no SDK
code is forked.

### Workspace commands
- `pnpm -r typecheck` — typecheck every workspace project.
- `pnpm -r test` — run the vitest suites.
- `pnpm --filter web build` — production build (Next `--webpack` + Serwist PWA).

## Deploy (federation)

`deploy/cloud` (Zambales province HUB) + `deploy/onprem` (Santa Cruz municipal NODE, over Tailscale)
carry the federation topology (`NODE_ROLE`/`NODE_ID`/`PEERS`/`NODE_TOKEN`/`PROVINCE_TENANT`/
`DEFAULT_TENANT`). The api's node pump (`/api/node/pull`, `/api/node/pump`) projects issued MTOPs,
enacted ordinances, and projects UP to the province; PII, payments, and feedback stay `local_only`.

> The api ships **`apps/api/Dockerfile`** (a multi-stage pnpm build). Since `@gelabs/sp` is private,
> pass a read token at build time — the composes read it from `$NPM_TOKEN` (a BuildKit secret):
> `NPM_TOKEN=<read-token> docker compose -f deploy/cloud/compose.yml build`. The container applies
> migrations (owner role) then starts the Fastify server. Local dev still runs the apps directly via
> `pnpm dev:api` / `pnpm dev:web`.
