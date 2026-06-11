# Santa Cruz Sanggunian — Progress Log

> **Running log of completed phases and steps.** Newest entries on top.
> Context lives in [`project.md`](./project.md); breakthroughs & milestones in [`learnings.md`](./learnings.md).

**Status legend:** ✅ done & verified · 🔄 built, verification pending · ⬜ planned/next

**Location:** project lives at `~/dev/sp` (moved off iCloud-synced `~/Desktop` — see blocker note below).

---

## 🗺️ Roadmap (phases)

| Phase | Name | Status |
|---|---|---|
| 0 | Project kickoff & documentation | ✅ Done |
| 1 | Front-end scaffold & foundations | ✅ Verified |
| 2 | App shell, navigation & dashboard | ✅ Verified |
| 3 | Module 1 — Smart Search & OCR E-Library | ✅ Verified |
| 4 | Module 2 — Paperless Session Dashboard | ✅ Verified |
| 5 | Module 3 — Legislative Tracking & Workflow | ✅ Verified |
| 6 | Module 4 — Data Analytics & Secretariat Reports | ✅ Verified |
| 7 | Public transparency portal (optional) | ✅ Verified |
| 8 | Backend/API + real OCR + auth integration | ⬜ Future |

---

## ✅ Verified green (2026-05-26)
`pnpm build` passes: **compiled in 2.3s, TypeScript in 3.0s (0 errors), 9 routes generated** (`/`, `/search`, `/sessions`, `/tracking`, `/analytics`, `/portal`, `/_not-found`).

**Root cause of the long verification saga (now fixed):** the project was in iCloud-synced `~/Desktop`, and its files were *dataless* (stored in cloud, not local). `next build`/`tsc` froze at 0% CPU waiting on iCloud to download files. **Fix:** moved the project to local `~/dev/sp` + fresh `pnpm install` → build runs in seconds. (Earlier suspects — Docker VM, low disk, swap — were real contributors to load but not the core blocker.)

---

## Phase 7 — Public transparency portal  ✅
**Built & verified — 2026-05-26**
- [x] Route-group refactor: `(app)` staff shell vs `(public)` sidebar-free portal layout.
- [x] `/portal` — public hero, search of approved/enacted measures, municipal projects, feedback form (toast).

## Phase 6 — Module 4: Data Analytics & Secretariat Reports  ✅
**Built & verified — 2026-05-26**
- [x] `/analytics` exec stat cards (records, pending approval, enacted, digitization rate).
- [x] Distribution charts (CSS-based): measures by category, committee productivity, records by year.
- [x] OCR & digitization status panel; Secretariat reports section.

## Phase 5 — Module 3: Legislative Tracking & Workflow  ✅
**Built & verified — 2026-05-26**
- [x] `/tracking` `TrackingBoard` (segmented: Pipeline / Committees / Voting).
- [x] Visual pipeline by stage; committee hubs; voting records (Carried/Failed).

## Phase 4 — Module 2: Paperless Session Dashboard  ✅
**Built & verified — 2026-05-26**
- [x] `/sessions` `SessionDashboard`: session picker + live Order of Business.
- [x] In-session document viewer side panel; session meta (date, mode, members, docs).

## Phase 3 — Module 1: Smart Search & OCR E-Library  ✅
**Built & verified — 2026-05-26**
- [x] `/search` + client `SearchExplorer`: keyword search + type/category/year/source filters.
- [x] Results table surfacing OCR status, confidence %, and "metadata-only" flag for failed-OCR records.

## Phase 2 — App shell, navigation & dashboard  ✅
**Built & verified — 2026-05-26**
- [x] Collapsible sidebar, sticky header/breadcrumb, layout providers.
- [x] Executive Dashboard with live mock data (stat cards, pipeline, upcoming session, recent activity).
- [x] Fixed Base UI API mismatches (`render` vs `asChild`; tooltip `delay`).

## Phase 1 — Front-end scaffold & foundations  ✅
**Built & verified — 2026-05-26**
- [x] Next.js 16 + React 19 + TypeScript + Tailwind v4 (App Router, `src/`, `@/*`) via pnpm.
- [x] shadcn/ui (Base UI variant), 20 components; OCR-first-class domain model; Zambales mock data; navy theme.

## Phase 0 — Project kickoff & documentation  ✅
**2026-05-26 · Done**
- [x] Defined Santa Cruz Sanggunian; confirmed type (cloud web-app), stack, stage; authored the three living docs.

---

## Phase 8 — Backend/API + real OCR + auth  ⬜ (future)
- [ ] Real API + database; real OCR engine; auth; deployment. (Out of current front-end scope.)

---

## Changelog
- **2026-06-11** — **Rebranded from the Iba build to Sangguniang Bayan ng Santa Cruz, Zambales.** Duplicated the codebase, swapped all branding (app name, titles, metadata, seal → `santa-cruz-seal.png`, cookie/storage keys, dev port → 3940). Replaced placeholder officials with the **real 2025–2028 elected SB** (Vice Mayor **Miguel M. Maniago, Jr.** presiding + 8 councilors: Ebido, Matibag, Menor, Maya, Misa, Misola, Merced, Galicia; Mayor **Consolacion M. Marty**). Re-localized geography to real Santa Cruz barangays — franchise zones (Poblacion North/South + 12 rural), TODAs, franchise prefix `STC-`, projects, and document references. Legislation/votes/committee assignments remain clearly-labeled fictional samples. `pnpm build` green (12 routes); `/login` + `/portal` verified at runtime. **Pending:** real municipal seal (`public/santa-cruz-seal.png` currently a placeholder) and `favicon.ico`.
- **2026-06-09** — Built **Prangkisa — Tricycle Franchising & MTOP** module from a Claude-Design handoff, as a **new `Franchising` nav category** inside the `(app)` shell (route `/prangkisa`). Recreated the design's 6 screens (Dashboard, 4-step Apply wizard + live MTOP preview, 6-step tracking timeline, online Payment, Digital MTOP credential, public Verify) **in the app's own branding** — shadcn + Tailwind tokens + Geist + lucide, dark app shell, real `santa-cruz-seal.png`; **dropped the design's separate light shell / Quicksand fonts / own CSS tokens** per request. Stateful single-client-root SPA (`prangkisa-module.tsx`) keeps file→inspect→pay→SB-approve→issue state across views. Santa Cruz data (4 service types, doc-checklist matrix, 14 zones, fee schedule, stages) ported to typed `data.ts`. Credential card fixed to brand navy `#0e1b34` (theme-independent). `tsc` + `eslint` green; full happy-path + not-found verified in headless Chrome (0 console errors, cross-view state persists).
- **2026-05-26** — Post-login content switched to a **navy dark theme** (matches the header) via dark tokens; added **gold sparklines** to dashboard stat tiles and a **floating/elevated featured stat card**. Login & portal stay light.
- **2026-05-26** — Redesigned the **post-login app shell** to the `UI.jpg` template: slim **red icon rail** (Santa Cruz seal + nav), **navy top bar** (page title + search/bell + user), **light rounded content panel**, **gold-accent stat tiles**. Login & public portal unchanged. `tsc` green; routes serve.
- **2026-05-26** — Added **OCR scanning** (`/scan`, Tesseract.js in-browser): capture → extract → dedupe by ref#/title → save; localStorage document store; `/documents/[id]` detail view; saved scans appear in the E-Library. Renamed the app to **Santa Cruz Sanggunian**. UI polish (stat-card icon chips). `tsc` green; routes serve.
- **2026-05-26** — **Localized to Sangguniang Bayan ng Santa Cruz (municipal):** Vice Mayor **Joan Ballesteros** presiding + Councilors; Governor→Mayor; Santa Cruz documents & barangays across data / UI / types. `tsc` green, renders verified.
- **2026-05-26** — Added **demo login** (`/login`): Vice Mayor (presiding officer) + Councilor accounts; cookie-based auth; `(app)` routes gated → redirect to `/login`; header shows signed-in user + role + sign-out; `/portal` stays public. `tsc` green.
- **2026-05-26** — ✅ **VERIFIED GREEN.** `pnpm build` passes (compile 2.3s, TS 3.0s, 9 routes). Root cause of freezes was iCloud (dataless files in `~/Desktop`); fixed by relocating to `~/dev/sp`. Disabled typed routes + `href: string` for robustness.
- **2026-05-26** — Moved project off iCloud `~/Desktop/mvp/sp` → local `~/dev/sp`; reinstalled deps (10.5s).
- **2026-05-26** — Phase 7 built: public transparency portal (`(app)`/`(public)` route groups, `/portal`).
- **2026-05-26** — Phase 6 built: Data Analytics & Secretariat Reports.
- **2026-05-26** — Phase 5 built: Legislative Tracking & Workflow.
- **2026-05-26** — Phase 4 built: Paperless Session Dashboard.
- **2026-05-26** — Phase 3 built: Smart Search & OCR E-Library.
- **2026-05-26** — Phase 2 built: app shell + Executive Dashboard; fixed Base UI type errors.
- **2026-05-26** — Phase 1 built: Next.js 16 scaffold + foundations.
- **2026-05-26** — Project defined; three living docs created.

---

*Last updated: 2026-06-09*
