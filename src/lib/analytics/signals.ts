/**
 * Deterministic rule-based signal engine (research hypotheses, not predictions).
 * All strategies read precomputed CAUSAL indicator series at bar `i` only.
 */
import {
  adx, atr, bollinger, ema, macd, priorHighest, priorLowest, relativeVolume, rollingPercentile, rsi, sma,
} from "./indicators";
import type {
  Candle, Direction, Evidence, Regime, Series, SignalOutcome, SignalRecord, StrategyMeta, TargetLevel,
} from "./types";

export interface Context {
  symbol: string;
  candles: Candle[];
  close: number[];
  high: number[];
  low: number[];
  sma20: Series;
  sma50: Series;
  sma200: Series;
  ema21: Series;
  rsi14: Series;
  macdLine: Series;
  macdSignal: Series;
  macdHist: Series;
  atr14: Series;
  adx14: Series;
  plusDI: Series;
  minusDI: Series;
  bbMid: Series;
  bbUpper: Series;
  bbLower: Series;
  bbWidth: Series;
  bbWidthPct: Series;
  relVol: Series;
  hi20: Series;
  lo20: Series;
}

export const MIN_BARS = 210;

export function buildContext(symbol: string, candles: Candle[]): Context {
  const close = candles.map((c) => c.close);
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const m = macd(close);
  const a = adx(high, low, close);
  const bb = bollinger(close);
  return {
    symbol, candles, close, high, low,
    sma20: sma(close, 20), sma50: sma(close, 50), sma200: sma(close, 200), ema21: ema(close, 21),
    rsi14: rsi(close), macdLine: m.macd, macdSignal: m.signal, macdHist: m.hist,
    atr14: atr(high, low, close), adx14: a.adx, plusDI: a.plusDI, minusDI: a.minusDI,
    bbMid: bb.mid, bbUpper: bb.upper, bbLower: bb.lower, bbWidth: bb.bandwidth,
    bbWidthPct: rollingPercentile(bb.bandwidth, 120),
    relVol: relativeVolume(candles.map((c) => c.volume)),
    hi20: priorHighest(high, 20), lo20: priorLowest(low, 20),
  };
}

export const STRATEGIES: Record<StrategyMeta["id"], StrategyMeta> = {
  "trend-ma": {
    id: "trend-ma", name: "Moving-average trend", version: "1.0", horizonBars: 20,
    summary: "Follows established trends using the alignment and slope of the 50- and 200-day averages.",
    rules: [
      "Bullish: close > SMA50 > SMA200 and SMA50 higher than 10 bars ago.",
      "Bearish: close < SMA50 < SMA200 and SMA50 lower than 10 bars ago.",
      "Strength blends ADX (trend quality) with the % gap between close and SMA50.",
    ],
  },
  "momentum-rsi-macd": {
    id: "momentum-rsi-macd", name: "RSI + MACD momentum", version: "1.0", horizonBars: 10,
    summary: "Requires RSI and the MACD histogram to agree on direction, and the histogram to be strengthening.",
    rules: [
      "Bullish: RSI(14) between 52 and 72, MACD histogram > 0 and greater than the prior bar.",
      "Bearish: RSI(14) between 28 and 48, MACD histogram < 0 and lower than the prior bar.",
      "RSI above 72 or below 28 is treated as stretched and does not trigger.",
    ],
  },
  "breakout-volume": {
    id: "breakout-volume", name: "Breakout with volume", version: "1.0", horizonBars: 15,
    summary: "A close beyond the prior 20-day range, confirmed by unusually high volume.",
    rules: [
      "Bullish: close > highest high of the prior 20 bars and volume ≥ 1.5× its 20-day average.",
      "Bearish: close < lowest low of the prior 20 bars and volume ≥ 1.5× its 20-day average.",
    ],
  },
  "mean-reversion": {
    id: "mean-reversion", name: "Mean reversion (trend-filtered)", version: "1.0", horizonBars: 6,
    summary: "Fades short-term stretches, but only in the direction of the long-term trend.",
    rules: [
      "Bullish: close > SMA200, RSI(14) < 35 and close at or below the lower Bollinger band.",
      "Bearish: close < SMA200, RSI(14) > 65 and close at or above the upper Bollinger band.",
    ],
  },
};

export interface StrategyResult {
  meta: StrategyMeta;
  direction: Direction;
  strength: number;
  supporting: Evidence[];
  /** Why the strategy is not triggering, or caveats on the trigger. */
  notes: Evidence[];
}

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const v = (s: Series, i: number) => s[i];
const fmt = (n: number, d = 1) => n.toFixed(d);

export function hasEnoughData(ctx: Context, i: number): boolean {
  return i >= MIN_BARS - 1 && ctx.sma200[i] != null && ctx.adx14[i] != null && ctx.relVol[i] != null && ctx.bbWidthPct[i] != null;
}

export function classifyRegime(ctx: Context, i: number): { regime: Regime; highVol: boolean; atrPct: number } {
  const a = v(ctx.adx14, i)!;
  const c = ctx.close[i];
  const s50 = v(ctx.sma50, i)!;
  const s200 = v(ctx.sma200, i)!;
  const atrPct = (v(ctx.atr14, i)! / c) * 100;
  let regime: Regime = "transition";
  if (a >= 25 && c > s50 && s50 > s200) regime = "trending_up";
  else if (a >= 25 && c < s50 && s50 < s200) regime = "trending_down";
  else if (a < 20) regime = "ranging";
  return { regime, highVol: atrPct > 3.5, atrPct };
}

export function trendStrategy(ctx: Context, i: number): StrategyResult {
  const meta = STRATEGIES["trend-ma"];
  const c = ctx.close[i], s50 = v(ctx.sma50, i)!, s200 = v(ctx.sma200, i)!, s50b = v(ctx.sma50, i - 10)!, a = v(ctx.adx14, i)!;
  const gap = ((c - s50) / s50) * 100;
  const quality = clamp((a - 15) / 25) * 0.6 + clamp(Math.abs(gap) / 5) * 0.4;
  if (c > s50 && s50 > s200 && s50 > s50b) {
    return { meta, direction: "bullish", strength: quality, notes: [], supporting: [
      { label: "Averages aligned up", detail: `Close ${fmt(c, 2)} > SMA50 ${fmt(s50, 2)} > SMA200 ${fmt(s200, 2)}.` },
      { label: "Trend quality", detail: `ADX(14) is ${fmt(a)}; ${a >= 25 ? "a trending market" : "trend strength is modest"}.` },
    ] };
  }
  if (c < s50 && s50 < s200 && s50 < s50b) {
    return { meta, direction: "bearish", strength: quality, notes: [], supporting: [
      { label: "Averages aligned down", detail: `Close ${fmt(c, 2)} < SMA50 ${fmt(s50, 2)} < SMA200 ${fmt(s200, 2)}.` },
      { label: "Trend quality", detail: `ADX(14) is ${fmt(a)}; ${a >= 25 ? "a trending market" : "trend strength is modest"}.` },
    ] };
  }
  return { meta, direction: "neutral", strength: 0, supporting: [], notes: [{ label: "Averages not aligned", detail: "Close, SMA50 and SMA200 do not form a clean ordered stack with a sloping SMA50." }] };
}

export function momentumStrategy(ctx: Context, i: number): StrategyResult {
  const meta = STRATEGIES["momentum-rsi-macd"];
  const r = v(ctx.rsi14, i)!, h = v(ctx.macdHist, i)!, hp = v(ctx.macdHist, i - 1)!, atrV = v(ctx.atr14, i)!;
  const hNorm = clamp(Math.abs(h) / (atrV * 0.25));
  if (r >= 52 && r <= 72 && h > 0 && h > hp) {
    return { meta, direction: "bullish", strength: clamp((r - 50) / 22) * 0.5 + hNorm * 0.5, notes: [], supporting: [
      { label: "RSI constructive", detail: `RSI(14) is ${fmt(r)}, above 50 but not stretched.` },
      { label: "MACD histogram rising", detail: `Histogram ${fmt(h, 2)} vs ${fmt(hp, 2)} on the prior bar.` },
    ] };
  }
  if (r >= 28 && r <= 48 && h < 0 && h < hp) {
    return { meta, direction: "bearish", strength: clamp((50 - r) / 22) * 0.5 + hNorm * 0.5, notes: [], supporting: [
      { label: "RSI weak", detail: `RSI(14) is ${fmt(r)}, below 50 but not yet oversold.` },
      { label: "MACD histogram falling", detail: `Histogram ${fmt(h, 2)} vs ${fmt(hp, 2)} on the prior bar.` },
    ] };
  }
  const why = r > 72 || r < 28 ? `RSI(14) is ${fmt(r)}, which this strategy treats as stretched.` : "RSI and the MACD histogram do not agree on a strengthening direction.";
  return { meta, direction: "neutral", strength: 0, supporting: [], notes: [{ label: "No momentum confirmation", detail: why }] };
}

export function breakoutStrategy(ctx: Context, i: number): StrategyResult {
  const meta = STRATEGIES["breakout-volume"];
  const c = ctx.close[i], hi = v(ctx.hi20, i)!, lo = v(ctx.lo20, i)!, rv = v(ctx.relVol, i)!, atrV = v(ctx.atr14, i)!;
  if (c > hi && rv >= 1.5) {
    return { meta, direction: "bullish", strength: clamp((rv - 1) / 2) * 0.6 + clamp((c - hi) / atrV) * 0.4, notes: [], supporting: [
      { label: "20-day high cleared", detail: `Close ${fmt(c, 2)} is above the prior 20-day high of ${fmt(hi, 2)}.` },
      { label: "Volume confirmation", detail: `Volume is ${fmt(rv, 2)}× its 20-day average.` },
    ] };
  }
  if (c < lo && rv >= 1.5) {
    return { meta, direction: "bearish", strength: clamp((rv - 1) / 2) * 0.6 + clamp((lo - c) / atrV) * 0.4, notes: [], supporting: [
      { label: "20-day low broken", detail: `Close ${fmt(c, 2)} is below the prior 20-day low of ${fmt(lo, 2)}.` },
      { label: "Volume confirmation", detail: `Volume is ${fmt(rv, 2)}× its 20-day average.` },
    ] };
  }
  const beyond = c > hi || c < lo;
  return { meta, direction: "neutral", strength: 0, supporting: [], notes: [{
    label: beyond ? "Range break lacks volume" : "Inside 20-day range",
    detail: beyond ? `Price left the 20-day range but volume is only ${fmt(rv, 2)}× average (needs ≥ 1.5×).` : `Close ${fmt(c, 2)} is between ${fmt(lo, 2)} and ${fmt(hi, 2)}.`,
  }] };
}

export function meanReversionStrategy(ctx: Context, i: number): StrategyResult {
  const meta = STRATEGIES["mean-reversion"];
  const c = ctx.close[i], s200 = v(ctx.sma200, i)!, r = v(ctx.rsi14, i)!, up = v(ctx.bbUpper, i)!, lo = v(ctx.bbLower, i)!;
  if (c > s200 && r < 35 && c <= lo) {
    return { meta, direction: "bullish", strength: clamp((35 - r) / 20), notes: [], supporting: [
      { label: "Pullback inside an uptrend", detail: `Close is above SMA200 (${fmt(s200, 2)}) while RSI(14) has dropped to ${fmt(r)}.` },
      { label: "Lower band touched", detail: `Close ${fmt(c, 2)} is at or below the lower Bollinger band ${fmt(lo, 2)}.` },
    ] };
  }
  if (c < s200 && r > 65 && c >= up) {
    return { meta, direction: "bearish", strength: clamp((r - 65) / 20), notes: [], supporting: [
      { label: "Rally inside a downtrend", detail: `Close is below SMA200 (${fmt(s200, 2)}) while RSI(14) has risen to ${fmt(r)}.` },
      { label: "Upper band touched", detail: `Close ${fmt(c, 2)} is at or above the upper Bollinger band ${fmt(up, 2)}.` },
    ] };
  }
  return { meta, direction: "neutral", strength: 0, supporting: [], notes: [{ label: "No stretch", detail: `RSI(14) is ${fmt(r)} and price is inside its Bollinger bands.` }] };
}

export function runStrategies(ctx: Context, i: number): StrategyResult[] {
  return [trendStrategy(ctx, i), momentumStrategy(ctx, i), breakoutStrategy(ctx, i), meanReversionStrategy(ctx, i)];
}

export interface Composition {
  status: "bullish" | "bearish" | "neutral" | "insufficient_data";
  results: StrategyResult[];
  primary: StrategyResult | null;
  regime: ReturnType<typeof classifyRegime> | null;
  /** True when strategies trigger in opposite directions. */
  conflicted: boolean;
}

export function compose(ctx: Context, i: number): Composition {
  if (!hasEnoughData(ctx, i)) return { status: "insufficient_data", results: [], primary: null, regime: null, conflicted: false };
  const results = runStrategies(ctx, i);
  const regime = classifyRegime(ctx, i);
  const active = results.filter((r) => r.direction !== "neutral");
  const bulls = active.filter((r) => r.direction === "bullish");
  const bears = active.filter((r) => r.direction === "bearish");
  const strong = (rs: StrategyResult[]) => Math.max(0, ...rs.map((r) => r.strength));
  const conflicted = bulls.length > 0 && bears.length > 0 && Math.min(strong(bulls), strong(bears)) >= 0.25;
  if (active.length === 0 || conflicted) return { status: "neutral", results, primary: null, regime, conflicted };
  const primary = [...active].sort((a, b) => b.strength - a.strength)[0];
  return { status: primary.direction as "bullish" | "bearish", results, primary, regime, conflicted };
}

const REGIME_LABEL: Record<Regime, string> = {
  trending_up: "uptrend", trending_down: "downtrend", ranging: "range-bound market", transition: "transitional market",
};
export const regimeLabel = (r: Regime) => REGIME_LABEL[r];

/** Build the full signal record for a composition that has a primary direction. */
export function buildSignal(ctx: Context, i: number, comp: Composition): SignalRecord | null {
  if (!comp.primary || comp.status === "neutral" || comp.status === "insufficient_data" || !comp.regime) return null;
  const p = comp.primary;
  const dir = p.direction as "bullish" | "bearish";
  const sign = dir === "bullish" ? 1 : -1;
  const entry = ctx.close[i];
  const atrV = v(ctx.atr14, i)!;
  const stopMult = p.meta.id === "mean-reversion" ? 1.5 : 2;
  const stop = entry - sign * stopMult * atrV;
  const risk = Math.abs(entry - stop);
  const targets: TargetLevel[] = [];
  if (p.meta.id === "mean-reversion") {
    const mid = v(ctx.bbMid, i)!;
    const r = Math.abs(mid - entry) / risk;
    if (r >= 1 && (mid - entry) * sign > 0) targets.push({ label: "T1 · 20-day mean", price: mid, r });
  } else {
    targets.push({ label: "T1 · 1.5R", price: entry + sign * 1.5 * risk, r: 1.5 });
    targets.push({ label: "T2 · 3R", price: entry + sign * 3 * risk, r: 3 });
  }
  const supporting: Evidence[] = [...p.supporting];
  const conflicting: Evidence[] = [];
  for (const r of comp.results) {
    if (r === p) continue;
    if (r.direction === dir) supporting.push(...r.supporting.map((e) => ({ label: `${r.meta.name}: ${e.label}`, detail: e.detail })));
    else if (r.direction !== "neutral") conflicting.push(...r.supporting.map((e) => ({ label: `${r.meta.name} points the other way`, detail: e.detail })));
    else if (r.meta.id !== p.meta.id) conflicting.push(...r.notes.map((e) => ({ label: `${r.meta.name}: not confirming`, detail: e.detail })));
  }
  const { regime, highVol, atrPct } = comp.regime;
  const aligned = (regime === "trending_up" && dir === "bullish") || (regime === "trending_down" && dir === "bearish");
  const opposed = (regime === "trending_up" && dir === "bearish") || (regime === "trending_down" && dir === "bullish");
  if (aligned) supporting.push({ label: "Regime agrees", detail: `The market is classified as an ${REGIME_LABEL[regime]}.` });
  if (opposed) conflicting.push({ label: "Against the regime", detail: `This ${dir} setup runs against the prevailing ${REGIME_LABEL[regime]}.` });
  if (regime === "ranging" && p.meta.id !== "mean-reversion") conflicting.push({ label: "Range-bound market", detail: "ADX is below 20, so trend and breakout setups fail more often in ranges." });
  if (highVol) conflicting.push({ label: "High volatility", detail: `ATR is ${fmt(atrPct)}% of price; wide stops mean small position sizes.` });
  const rr = targets.length ? targets[0].r : null;
  const date = ctx.candles[i].date;
  const horizon = p.meta.horizonBars;
  const expiresOn = ctx.candles[i + horizon]?.date ?? null;
  const signal: SignalRecord = {
    id: `${ctx.symbol.replace(/\s+/g, "-")}~${p.meta.id}~${date}`,
    symbol: ctx.symbol, exchange: "NSE", direction: dir,
    strategy: { id: p.meta.id, name: p.meta.name, version: p.meta.version },
    timeframe: "1D", generatedOn: date, inputDataThrough: date, source: "demo-simulated",
    indicators: {
      close: entry, sma50: v(ctx.sma50, i)!, sma200: v(ctx.sma200, i)!, rsi14: v(ctx.rsi14, i)!,
      macdHist: v(ctx.macdHist, i)!, adx14: v(ctx.adx14, i)!, atr14: atrV, relVol: v(ctx.relVol, i)!,
    },
    entryRef: entry,
    entryNote: `Reference is the ${date} close. A real entry would be decided on a later bar; slippage is not included.`,
    stop, targets, horizonBars: horizon, expiresOn, riskReward: rr, strength: p.strength,
    supporting, conflicting, barIndex: i,
    outcome: { status: "active", barsEvaluated: 0, resolvedOn: null, directionalMovePct: 0 },
  };
  signal.outcome = evaluateOutcome(ctx, signal);
  return signal;
}

/**
 * Evaluate what happened AFTER a signal bar. Conservative rule: if a bar touches both stop
 * and first target, the stop is assumed to hit first.
 */
export function evaluateOutcome(ctx: Context, s: SignalRecord): SignalOutcome {
  const sign = s.direction === "bullish" ? 1 : -1;
  const last = ctx.candles.length - 1;
  const end = Math.min(s.barIndex + s.horizonBars, last);
  const t1 = s.targets[0]?.price ?? null;
  for (let j = s.barIndex + 1; j <= end; j++) {
    const c = ctx.candles[j];
    const stopHit = sign === 1 ? c.low <= s.stop : c.high >= s.stop;
    const tHit = t1 != null && (sign === 1 ? c.high >= t1 : c.low <= t1);
    const move = (sign * (c.close - s.entryRef) / s.entryRef) * 100;
    if (stopHit) return { status: "invalidated", barsEvaluated: j - s.barIndex, resolvedOn: c.date, directionalMovePct: sign * (s.stop - s.entryRef) / s.entryRef * 100 };
    if (tHit) return { status: "target_reached", barsEvaluated: j - s.barIndex, resolvedOn: c.date, directionalMovePct: sign * (t1! - s.entryRef) / s.entryRef * 100 };
    if (j === end && s.barIndex + s.horizonBars <= last) return { status: "expired", barsEvaluated: j - s.barIndex, resolvedOn: c.date, directionalMovePct: move };
  }
  const evaluated = end - s.barIndex;
  const move = evaluated > 0 ? (sign * (ctx.candles[end].close - s.entryRef) / s.entryRef) * 100 : 0;
  return { status: "active", barsEvaluated: evaluated, resolvedOn: null, directionalMovePct: move };
}

/**
 * Replay the engine bar by bar (each bar sees only data up to itself) and record a signal
 * whenever a new directional setup appears. Past records are never rewritten.
 */
export function replaySignals(ctx: Context, lookback = 100): SignalRecord[] {
  const out: SignalRecord[] = [];
  const last = ctx.candles.length - 1;
  let prevKey = "";
  let lastEmitted: SignalRecord | null = null;
  for (let i = Math.max(MIN_BARS - 1, last - lookback); i <= last; i++) {
    const comp = compose(ctx, i);
    const key = comp.primary ? `${comp.primary.meta.id}:${comp.status}` : "";
    if (comp.primary && key !== prevKey) {
      // Cooldown: do not re-announce the same direction within 5 bars of the previous signal.
      const prior: SignalRecord | null = lastEmitted;
      const cooling: boolean = prior != null && prior.direction === comp.status && i - prior.barIndex < 5;
      const s: SignalRecord | null = cooling ? null : buildSignal(ctx, i, comp);
      if (s) { out.push(s); lastEmitted = s; }
    }
    prevKey = key;
  }
  return out;
}
