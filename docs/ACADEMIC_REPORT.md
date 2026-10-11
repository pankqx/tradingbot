# Academic report (working draft)

## Problem statement
Retail investors face dense indicator-heavy tools that give signals without explanation, and unexplained scores are easily mistaken for probabilities.

## Objectives
1. Generate explainable, deterministic trading hypotheses. 2. Show the evidence for and against each one. 3. Record every signal before judging it. 4. Keep simulated and real data strictly separate.

## Existing-system limitations
Opaque scoring, no visible failed signals, weak separation of research from advice.

## Proposed system and architecture
See `ARCHITECTURE.md` and `SIGNAL_METHODOLOGY.md`.

## Testing (current)
Unit tests cover indicator maths (hand-computed cases and property checks), causality (no look-ahead), stop/target geometry, outcome evaluation and score normalisation. Run `npm test`.

## Results
None reported yet. The ledger statistics in the app describe behaviour on simulated random-walk data only and are not evidence of predictive value.

## Limitations
Simulated data; no costs or slippage; no out-of-sample validation; no persistence or accounts yet.

## Future work
Backtesting with costs and out-of-sample splits, paper trading, onboarding and personalisation, licensed data, accessibility audit, regulatory review before any public launch.
