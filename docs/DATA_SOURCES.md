# Data sources

## Today
`demo-simulated`: a seeded random walk (mulberry32) with a per-symbol trend/volatility scenario, 320 business-day candles ending 2026-10-09, rescaled to a target level. Not exchange data. Holidays and corporate actions are not modelled. Every screen carries a "Simulated" label.

## Live data (not implemented)
A live adapter must implement `MarketDataProvider`, return its own `id`, timestamps and licence, surface stale and unavailable states, and never fall back to demo data. Before choosing one, verify current terms, historical coverage, rate limits, commercial and redistribution restrictions. Candidates to evaluate: NSE/BSE official data products, licensed vendors, and broker APIs for a user's own account. Unofficial endpoints must not be assumed to allow redistribution.

## Fundamentals and news
Not shown. They will appear only from a licensed source.
