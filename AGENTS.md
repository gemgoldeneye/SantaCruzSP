# SantaCruzSP — agent guide

The **Santa Cruz, Zambales** deployment of the `@gelabs/sp` SDK. This repo **consumes** the platform; it
does not contain it. Per-LGU values live ONLY in `config/santacruz`; everything platform-wide is `@gelabs/sp`.

## Stack
- `apps/web` — Next.js 16 (App Router): the offline-first staff console (`/`, client-rendered +
  Dexie/sync-client) + the citizen portal (`/portal`, SSR + client islands). Proxies `/api` +
  `/auth` + `/healthz` to the Fastify api via same-origin `next.config` rewrites. Dev + prod build
  use `--webpack` (Serwist PWA). SSR-safety: never import sync-client/data from the root (server) layout.
- `apps/api` — `@sp/api`: Fastify 5 booting `defineSpRuntime(config)` from `@gelabs/sp/runtime`
  (document store + offline sync + workflow + multi-tenant RLS + federation node pump).
- `config/santacruz` — `@lgu/santacruz`: one `defineSpConfig()` — the ONLY place Santa Cruz values live.
- `@gelabs/sp` — the SDK umbrella (subpaths: `runtime`/`data`/`contracts`/`modules`/`sync-client`
  [`/ui`]/`ui`[`/client`]/`config`). Consumed from npm as the published private `@gelabs/sp@^0.3.0`.
- `deploy/{cloud,onprem,dev}` — federation (province HUB ↔ Santa Cruz NODE over Tailscale). `legacy/web` — archived.

## Conventions
- All per-LGU values (identity, theme, offices, modules, fees, copy, demo logins) live ONLY in
  `config/santacruz`. Never hardcode Santa Cruz strings/assets/colors in `apps/*` — read them from config.
- Do NOT fork `@gelabs/sp`. Fix platform behavior upstream in the SDK (the `gelabs-sp` repo) and
  bump the version consumed here.
- pnpm workspace (`apps/*` + `config/*`), Node ≥ 22. Gate changes with `pnpm -r typecheck` (+ `pnpm -r test`).
- Delivery: one logical change per branch → PR to `main` → merge with merge commits.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
