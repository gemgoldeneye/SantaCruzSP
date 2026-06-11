# Santa Cruz Sanggunian — Santa Cruz Legislative E-Archive & Session

Cloud-based front-end for the **Sangguniang Bayan ng Santa Cruz, Zambales** (municipal council) — **Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Base UI)**. Uses sample/mock data only (no backend yet). See [`project.md`](./project.md) for full context, [`progress.md`](./progress.md) for the phase log, [`learnings.md`](./learnings.md) for key decisions.

## Verify
```bash
pnpm install
pnpm build      # type-checks, lints, and builds every route
```

## Run
```bash
pnpm dev        # then open http://localhost:3612
```

- **Staff app:** `/` (dashboard) · `/search` · `/sessions` · `/tracking` · `/analytics`
- **Public portal:** `/portal`

> If `pnpm build` ever stalls at 0% CPU, that's the machine (low free RAM/disk → swap thrash), not the code — a restart clears it, then the build finishes in ~2 min.
