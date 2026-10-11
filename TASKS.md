# Tasks

## Milestone 1: shell and foundations
- [x] Repository audit (it contained only a LICENSE)
- [x] Design tokens, light and dark themes, no-flash theme script
- [x] Sidebar, mobile nav, header, ⌘K palette, market session pill, notifications from the signal ledger
- [x] Deterministic demo data provider behind a provider interface
- [ ] Browser tests (Playwright) checked into the repo

## Milestone 2: personalised research (partly done)
- [x] Screener with filters, sorting, pagination, saved filters, local watchlist
- [x] Instrument research page
- [ ] Onboarding flow and editable profile
- [ ] Prisma + SQLite persistence, auth, server-side validation with Zod
- [ ] Fundamentals (needs a licensed provider)

## Milestone 3: signal engine (mostly done)
- [x] SMA/EMA/RSI/MACD/ATR/ADX/Bollinger with causality tests
- [x] Four strategies, regime classification, explanations, replayed ledger with outcomes
- [ ] Auditable correction log for signal records
- [ ] Persist signals in the database at generation time

## Milestone 4: charts and backtesting
- [x] Candlestick chart with overlays, panes, theme-aware styling, setup zones
- [ ] Backtest engine with costs, slippage, out-of-sample validation
- [ ] Real historical data adapter (licence check first)

## Milestone 5: paper trading and academy
- [ ] Simulated portfolio and journal
- [ ] Lessons, quizzes, progress

## Milestone 6: demonstration
- [ ] Full test pass, responsive and accessibility review, demo script, final report with real results
