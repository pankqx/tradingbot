<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# tradingb0t: conventions for coding agents

Academic fintech prototype (MCA project): explainable stock research and rule-based signals for Indian markets.
Currently runs on **simulated** data only. Honesty is a product requirement, not a style choice.

## Hard rules
- Never invent prices, fundamentals, news, backtest results or accuracy claims. Anything simulated is labelled "Simulated".
- Never silently fall back from a live feed to demo data. Providers implement `MarketDataProvider` (`src/lib/data/types.ts`).
- A research score is not a probability. Do not present it as one.
- No real-money execution, broker credentials or OTPs. Ever.
- Financial calculations live in `src/lib/analytics` and must stay pure, causal (no look-ahead) and unit-tested. UI components only render.
- Do not rewrite or delete historical signal records; corrections must be auditable.

## Layout
- `src/lib/analytics`: indicators, strategies (`signals.ts`), scoring, explanations. Tests beside the code.
- `src/lib/data`: provider contract, deterministic demo provider, `universe.ts` (server-side snapshot of everything).
- `src/components`: shared UI. `src/app/(app)`: authenticated shell and routes.
- Design tokens are CSS variables in `src/app/globals.css` (light and dark are separate, complete sets). Use the Tailwind aliases (`bg-surface`, `text-ink-2`, `text-up`...) and never hard-code colours.

## Commands
`npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npm run build:pages` (static export for GitHub Pages; Cache Components cannot be enabled because export needs no Node server)

## Workflow
Small commits, using the repository owner's git identity. Do not add co-author trailers. Run tests, typecheck and lint before committing.
