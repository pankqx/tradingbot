/** Core domain types shared by the data layer, analytics engine and UI. */

export interface Candle {
  /** ISO calendar date (YYYY-MM-DD), exchange-local trading day. */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Indicator series use `null` during the warm-up period. */
export type Series = (number | null)[];

export type Direction = "bullish" | "bearish" | "neutral";

export type SignalStatus =
  | "active"
  | "target_reached"
  | "invalidated"
  | "expired"
  | "insufficient_data";

export type Regime = "trending_up" | "trending_down" | "ranging" | "transition";

export interface Evidence {
  label: string;
  detail: string;
}

export interface StrategyMeta {
  id: "trend-ma" | "momentum-rsi-macd" | "breakout-volume" | "mean-reversion";
  name: string;
  version: string;
  summary: string;
  rules: string[];
  horizonBars: number;
}

export interface TargetLevel {
  label: string;
  price: number;
  /** Distance from entry expressed in multiples of initial risk (R). */
  r: number;
}

export interface SignalOutcome {
  status: Exclude<SignalStatus, "insufficient_data">;
  /** Bars elapsed since the signal bar that were evaluated. */
  barsEvaluated: number;
  /** Date of first stop / target touch, if any. */
  resolvedOn: string | null;
  /** Close-to-close move in the signal direction at resolution or latest bar, in %. */
  directionalMovePct: number;
}

export interface SignalRecord {
  id: string;
  symbol: string;
  exchange: "NSE";
  direction: Exclude<Direction, "neutral">;
  strategy: Pick<StrategyMeta, "id" | "name" | "version">;
  timeframe: "1D";
  /** Bar date on which the signal was generated (uses data up to and including this bar). */
  generatedOn: string;
  /** Timestamp of the last input bar used. */
  inputDataThrough: string;
  source: "demo-simulated";
  indicators: Record<string, number>;
  entryRef: number;
  entryNote: string;
  stop: number;
  targets: TargetLevel[];
  horizonBars: number;
  expiresOn: string | null;
  riskReward: number | null;
  /** Strength of this strategy's trigger, 0..1. Not a probability. */
  strength: number;
  supporting: Evidence[];
  conflicting: Evidence[];
  barIndex: number;
  outcome: SignalOutcome;
}

export interface FactorScore {
  key: "trend" | "momentum" | "volume" | "volatility" | "liquidity" | "regime";
  label: string;
  weight: number;
  /** Normalised 0..1; null when the input data is missing. */
  value: number | null;
  note: string;
}

export interface ResearchScore {
  /** 0..100 weighted evidence alignment. NOT a probability of profit. */
  score: number;
  lean: Exclude<Direction, "neutral">;
  factors: FactorScore[];
}
