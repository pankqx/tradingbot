# Signal methodology

Authoritative definitions are in `src/lib/analytics/signals.ts` and are rendered at `/methodology`.

## Strategies (all daily bars, all deterministic)
| Strategy | Bullish | Bearish | Review window |
| --- | --- | --- | --- |
| Moving-average trend | close > SMA50 > SMA200, SMA50 rising vs 10 bars ago | mirror | 20 days |
| RSI + MACD momentum | RSI 52–72, MACD histogram > 0 and rising | RSI 28–48, histogram < 0 and falling | 10 days |
| Breakout with volume | close > prior 20-day high, volume ≥ 1.5× 20-day average | mirror | 15 days |
| Mean reversion (trend-filtered) | close > SMA200, RSI < 35, close ≤ lower Bollinger band | mirror | 6 days |

Composition: if rules trigger in opposite directions with strength ≥ 0.25 each, the state is neutral/mixed; otherwise the strongest rule is primary and the others become supporting or conflicting evidence. Fewer than 210 bars gives "insufficient data".

## Regime
ADX ≥ 25 with price above SMA50 above SMA200 is an uptrend (mirror for downtrend); ADX < 20 is range-bound; else transitional. ATR > 3.5% of price flags high volatility.

## Risk definition
Stop = 2 × ATR(14) from the close (1.5 × for mean reversion). 1R is that distance. Targets: +1.5R and +3R (mean reversion: the 20-day mean if ≥ 1R). Targets are planning distances, not forecasts.

## Research score
Weighted mean of normalised factors: trend 25%, momentum 20%, volume 15%, volatility suitability 10%, liquidity 10%, regime 20%. Missing factors are dropped and weights renormalised. It is not a probability.

## Outcome evaluation
Signals are recorded before outcomes are measured. After the signal bar: stop touched → invalidated; target 1 touched → target reached; window elapsed with neither → expired. A bar touching both counts as stop-first. Directional move (close vs entry in the signal's direction) is reported separately from profitability. Transaction costs and slippage are not yet applied.

## Caveats
Results on simulated data are not evidence of real-market performance. No out-of-sample validation exists yet.
