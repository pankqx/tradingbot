/**
 * Explainable research score. A weighted blend of normalised factors (0..1).
 * The result measures how well the evidence lines up. It is NOT a probability of profit.
 */
import { classifyRegime, type Context } from "./signals";
import type { FactorScore, ResearchScore } from "./types";

export const SCORE_WEIGHTS = {
  trend: 0.25, momentum: 0.2, volume: 0.15, volatility: 0.1, liquidity: 0.1, regime: 0.2,
} as const;

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

export function scoreInstrument(ctx: Context, i: number, liquidityPercentile: number | null): ResearchScore | null {
  const c = ctx.close[i];
  const s50 = ctx.sma50[i], s200 = ctx.sma200[i], a = ctx.adx14[i], r = ctx.rsi14[i], h = ctx.macdHist[i], rv = ctx.relVol[i];
  if (s50 == null || s200 == null || a == null || r == null || h == null || rv == null) return null;
  const { regime, atrPct } = classifyRegime(ctx, i);
  const lean = c >= s50 ? "bullish" : "bearish";
  const sign = lean === "bullish" ? 1 : -1;

  const aligned = (sign === 1 ? c > s50 && s50 > s200 : c < s50 && s50 < s200) ? 1 : (sign === 1 ? c > s200 : c < s200) ? 0.5 : 0;
  const trend = (clamp((a - 15) / 25) + aligned) / 2;
  const rsiPart = sign === 1 ? clamp((r - 45) / 25) : clamp((55 - r) / 25);
  const momentum = rsiPart * 0.5 + (h * sign > 0 ? 0.5 : 0);
  const volume = clamp((rv - 0.8) / 1.7);
  const volatility = atrPct <= 1 ? clamp(atrPct / 1) : atrPct <= 3 ? 1 : clamp(1 - (atrPct - 3) / 3);
  const regimeFit = (regime === "trending_up" && sign === 1) || (regime === "trending_down" && sign === -1) ? 1 : regime === "ranging" || regime === "transition" ? 0.5 : 0;

  const factors: FactorScore[] = [
    { key: "trend", label: "Trend strength", weight: SCORE_WEIGHTS.trend, value: trend, note: `ADX ${a.toFixed(0)}, averages ${aligned === 1 ? "fully" : aligned === 0.5 ? "partly" : "not"} aligned with the ${lean} lean` },
    { key: "momentum", label: "Momentum", weight: SCORE_WEIGHTS.momentum, value: momentum, note: `RSI ${r.toFixed(0)}, MACD histogram ${h * sign > 0 ? "agrees" : "disagrees"}` },
    { key: "volume", label: "Volume confirmation", weight: SCORE_WEIGHTS.volume, value: volume, note: `${rv.toFixed(2)}× the 20-day average volume` },
    { key: "volatility", label: "Volatility suitability", weight: SCORE_WEIGHTS.volatility, value: volatility, note: `ATR is ${atrPct.toFixed(2)}% of price; best between 1% and 3%` },
    { key: "liquidity", label: "Liquidity", weight: SCORE_WEIGHTS.liquidity, value: liquidityPercentile, note: liquidityPercentile == null ? "Turnover rank unavailable" : `Turnover ranks in the ${Math.round(liquidityPercentile * 100)}th percentile of this universe` },
    { key: "regime", label: "Market regime", weight: SCORE_WEIGHTS.regime, value: regimeFit, note: `Classified as ${regime.replace("_", " ")}` },
  ];
  // Missing factors are dropped and the remaining weights are renormalised.
  const avail = factors.filter((f) => f.value != null);
  const wSum = avail.reduce((s, f) => s + f.weight, 0);
  const score = (avail.reduce((s, f) => s + f.weight * f.value!, 0) / wSum) * 100;
  return { score, lean, factors };
}
