/**
 * Server-side analysis of the whole demo universe (computed once per process).
 * The UI consumes these plain-data snapshots; no financial logic lives in components.
 */
import { buildContext, buildSignal, compose, classifyRegime, replaySignals, type Context } from "@/lib/analytics/signals";
import { scoreInstrument } from "@/lib/analytics/scoring";
import type { Candle, Regime, ResearchScore, SignalRecord } from "@/lib/analytics/types";
import { demoProvider } from "./demo-provider";
import type { Instrument, Quote } from "./types";

export interface Snapshot {
  instrument: Instrument;
  quote: Quote;
  status: "bullish" | "bearish" | "neutral" | "insufficient_data";
  conflicted: boolean;
  signal: SignalRecord | null;
  score: ResearchScore | null;
  regime: Regime | null;
  atrPct: number | null;
  rsi: number | null;
  adx: number | null;
  relVol: number | null;
  aboveSma50: boolean | null;
  aboveSma200: boolean | null;
  sma50: number | null;
  sma200: number | null;
  ret1m: number | null;
  ret3m: number | null;
  turnover: number;
  /** Last ~60 closes for sparklines. */
  spark: number[];
  history: SignalRecord[];
}

export interface Universe {
  provider: { id: string; label: string; simulated: boolean };
  asOf: string;
  snapshots: Snapshot[];
  contexts: Map<string, Context>;
}

let cached: Universe | null = null;

const pct = (a: number, b: number) => ((a - b) / b) * 100;

export function getUniverse(): Universe {
  if (cached) return cached;
  const provider = demoProvider;
  const insts = provider.listInstruments();
  const contexts = new Map<string, Context>();
  const turnover = new Map<string, number>();
  for (const inst of insts) {
    const candles = provider.getCandles(inst.symbol);
    contexts.set(inst.symbol, buildContext(inst.symbol, candles));
    const tail = candles.slice(-20);
    turnover.set(inst.symbol, tail.reduce((s, c) => s + c.close * c.volume, 0) / tail.length);
  }
  const equities = insts.filter((x) => x.kind === "equity").map((x) => turnover.get(x.symbol)!).sort((a, b) => a - b);
  const liqPct = (t: number) => equities.filter((x) => x <= t).length / equities.length;

  const snapshots: Snapshot[] = insts.map((inst) => {
    const ctx = contexts.get(inst.symbol)!;
    const i = ctx.candles.length - 1;
    const comp = compose(ctx, i);
    const signal = buildSignal(ctx, i, comp);
    const quote = provider.getQuote(inst.symbol)!;
    const reg = comp.regime ?? (ctx.adx14[i] != null && ctx.sma200[i] != null ? classifyRegime(ctx, i) : null);
    const c = ctx.close[i];
    return {
      instrument: inst, quote, status: comp.status, conflicted: comp.conflicted, signal,
      score: inst.kind === "equity" ? scoreInstrument(ctx, i, liqPct(turnover.get(inst.symbol)!)) : scoreInstrument(ctx, i, null),
      regime: reg?.regime ?? null, atrPct: reg?.atrPct ?? null,
      rsi: ctx.rsi14[i], adx: ctx.adx14[i], relVol: ctx.relVol[i],
      aboveSma50: ctx.sma50[i] != null ? c > ctx.sma50[i]! : null,
      aboveSma200: ctx.sma200[i] != null ? c > ctx.sma200[i]! : null,
      sma50: ctx.sma50[i], sma200: ctx.sma200[i],
      ret1m: pct(c, ctx.close[i - 21]), ret3m: pct(c, ctx.close[i - 63]),
      turnover: turnover.get(inst.symbol)!,
      spark: ctx.close.slice(-60),
      history: replaySignals(ctx),
    };
  });
  cached = {
    provider: { id: provider.id, label: provider.label, simulated: provider.simulated },
    asOf: snapshots[0].quote.asOf, snapshots, contexts,
  };
  return cached;
}

export const getSnapshot = (symbol: string) => getUniverse().snapshots.find((s) => s.instrument.symbol === symbol) ?? null;
export const getCandles = (symbol: string): Candle[] => getUniverse().contexts.get(symbol)?.candles ?? [];

export function allHistory(): SignalRecord[] {
  return getUniverse().snapshots.flatMap((s) => s.history).sort((a, b) => b.generatedOn.localeCompare(a.generatedOn));
}

export function findSignal(id: string): SignalRecord | null {
  const decoded = decodeURIComponent(id);
  for (const s of getUniverse().snapshots) {
    if (s.signal?.id === decoded) return s.signal;
    const h = s.history.find((x) => x.id === decoded);
    if (h) return h;
  }
  return null;
}
