# tradingb0t

Explainable stock research and rule-based trading signals for Indian markets. An academic (MCA) prototype built to startup-quality standards.

> **All market data in this build is simulated.** Prices come from a deterministic generator, not an exchange. Signals are research hypotheses, not investment advice, and nothing here predicts returns.

## What works today (vertical slice)

| Area | Status |
| --- | --- |
| App shell: sidebar, ⌘K search, theme toggle (light / dark / system, no flash), responsive nav | Working |
| Overview: simulated index tape, ranked research queue, breadth, recently invalidated setups | Working |
| Discover: filterable, sortable, paginated screener with saved filters and a local watchlist | Working |
| Stock page: candlestick chart, SMA / Bollinger / volume / RSI / MACD, setup drawn on chart, score breakdown | Working |
| Signals: four rule-based strategies, regime classification, ledger with outcomes, signal detail page | Working |
| Methodology page generated from the same constants the engine uses | Working |
| Onboarding, persistence, backtesting, paper trading, academy, journal | Not built yet (see `TASKS.md`) |

## Run it

Requires Node 20.19+ (tested on 22).

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000
npm test             # indicator + signal engine tests
npm run build && npm start
```

No API keys are needed. See `.env.example` for the variables a live provider will use.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/SIGNAL_METHODOLOGY.md`](docs/SIGNAL_METHODOLOGY.md) · [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) · [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) · [`docs/ACADEMIC_REPORT.md`](docs/ACADEMIC_REPORT.md)

Charts by [TradingView Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) (Apache-2.0; attribution is kept visible).
