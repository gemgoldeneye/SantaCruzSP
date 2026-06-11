# Santa Cruz Sanggunian — Learnings, Breakthroughs & Milestones

> **The "aha" log.** Capture milestones reached, key decisions and *why* we made them,
> hard-won technical breakthroughs, and lessons that should change how we work next time.
> This is distinct from [`progress.md`](./progress.md) (what got done, when) — here we record
> *what we learned and why it matters*. Context lives in [`project.md`](./project.md).

**How to log:**
- **🏁 Milestone** — a meaningful threshold crossed (first module live, first OCR result, MVP demo-ready).
- **💡 Breakthrough** — a problem cracked, or an approach that proved notably better.
- **🧭 Decision** — a choice we committed to, with the reasoning (so we don't relitigate it).
- **⚠️ Lesson** — something that bit us; what to do differently.

Newest entries at the top.

---

## 🏁 Milestones

- **2026-05-26 — 🎉 Front-end MVP verified green.** All 7 phases (foundations, app shell, 4 spec modules, public portal) compile, **type-check with 0 errors, and build** — 9 routes. Feature-complete per the spec; only Phase 8 (backend) remains.
- **2026-05-26 — Project defined & documented.** Santa Cruz Sanggunian scope, modules, and tech direction locked in; docs system established.

---

## 💡 Breakthroughs & 🧭 Decisions

### 2026-05-26 · 💡 Breakthrough — Our shadcn/ui is **Base UI**, not Radix
**What:** `shadcn init` here produced the `base-nova` style, whose components import from `@base-ui/react/*`. Base UI's composition API differs from the Radix-era shadcn most snippets assume:
- Compose with the **`render`** prop, not `asChild`: `<SidebarMenuButton render={<Link href={href} />}>…children…</SidebarMenuButton>` (children pass through via `mergeProps`).
- `TooltipProvider` takes **`delay`** (default `0`), not `delayDuration`.
**Why it matters:** Pasting Radix-era shadcn snippets fails the TypeScript check. This was the root cause of the repeated build stops. Always check the component source and compose with `render`.

### 2026-05-26 · 🧭 Decision — Disabled Next 16 typed routes (use `href: string`)
**What:** Next 16 generates `.next/types/routes.d.ts` and validates `<Link href>` against it. That generated `Route` type proved fragile across clean checkouts / `.next` clears (and isn't plainly exported from `next`).
**How:** `typedRoutes: false` in `next.config.ts` + `NavItem.href: string` — compiles regardless of `.next` state. Trade-off: no compile-time link-literal checking. [[maintain-project-docs]]

### 2026-05-26 · 🧭 Decision — Front-end-first, Next.js + React + TypeScript
**Decision:** Build the front-end web-app first, on Next.js + React + TypeScript, with the backend (DB, real OCR service, auth) deferred.
**Why:** Lets us validate UX and the four core module flows fast, with mock data, before committing backend infrastructure. Next.js gives routing, SSR/SSG options, and a clean path to deploy a cloud web-app.
**Implication:** Design components and data access behind interfaces/adapters so swapping mock data for a real API later is low-friction.

### 2026-05-26 · 🧭 Decision — OCR is a first-class feature, not an afterthought
**Why:** The core value is making *decades of scanned physical records* searchable. The search UI and document model must assume some documents are OCR-derived (with confidence/quality caveats), not only born-digital PDFs.
**Implication:** Plan for OCR status/quality indicators in the document data model and search results from the start.

---

## ⚠️ Lessons

### 2026-05-26 · ⚠️ Lesson — iCloud-synced folders freeze Node builds (the big one)
**What bit us, hard:** the project lived in `~/Desktop`, which is iCloud-synced, and many files were *dataless* (in cloud, not on local disk). `next build`/`tsc` then **froze at 0% CPU**, blocked waiting for iCloud to download files on read. ~15 turns were lost blaming load/disk/swap/Docker — all real contributors, none the core cause.
**Tell-tale signs:** Node process stuck at startup, **0% CPU + tiny RSS (~19 MB)**, never progresses; `fileproviderd` busy; `find <dir> -flags +dataless` lists project files.
**Fix / rule:** keep dev projects **out of `~/Desktop` and `~/Documents`** (the iCloud-synced folders). Moving to `~/dev/sp` + fresh `pnpm install` took the build from ∞ freeze to **~5s**.

### 2026-05-26 · ⚠️ Lesson — Don't let the shell mask the build's real exit code
**What bit us:** `pnpm build 2>&1 | tail; echo …` made the harness report "exit 0" while the build had actually **failed** the type-check — the pipe plus a trailing `echo` swallowed the real status.
**Do instead:** capture it directly — `pnpm build > log 2>&1; CODE=$?` — and read the log, never trust just the wrapper's exit summary.

### 2026-05-26 · ⚠️ Lesson — Gate types with `tsc --noEmit`, not a 3-min full build
**What:** `next build` here compiles in ~3 min and reports only the *first* failing file, so type errors surfaced one slow build at a time. `tsc --noEmit` (incremental is on in `tsconfig`) reports *all* type errors at once and is far faster for iteration. Reserve a full `next build` for the final lint + bundle gate.

---

*Last updated: 2026-05-26*
