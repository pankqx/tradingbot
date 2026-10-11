# Architecture

Modular monolith on Next.js (App Router, React 19, TypeScript, Tailwind v4).

```
Browser ── React UI (src/app, src/components)
              │  plain serialisable props
Server ── Route handlers / server components
              │
              ├─ src/lib/data      provider contract + demo provider + universe snapshot
              └─ src/lib/analytics indicators → strategies → composition → outcomes, scoring, explanations
```

## Data flow
1. A `MarketDataProvider` returns candles and quotes (today: the deterministic demo provider).
2. `universe.ts` builds an indicator context per instrument, composes strategy results at the latest bar, scores it, and replays the engine over the last 100 bars to build the signal ledger.
3. Server components pass plain snapshots to client components (chart, queue, screener, ledger).
4. Client-only state (theme, watchlist, saved filters) lives in `localStorage` until accounts exist.

## Boundaries
- `src/lib/analytics` has no React, DOM or network imports. It is unit-tested, including a test that truncating future bars never changes a result.
- Components render and filter; they do not calculate indicators.
- Charts are theme-aware: they read CSS variables and rebuild on theme change, preserving the visible range.

## Planned
Prisma + SQLite (Postgres-ready) for users, profiles, watchlists, signals and paper trades; Zod validation on every route handler; rate limiting and audit logging for privileged operations; server-side enforcement that real-money execution is disabled.
