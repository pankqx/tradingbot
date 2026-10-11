import { describe, expect, it } from "vitest";
import { demoProvider } from "@/lib/data/demo-provider";
import { buildContext, buildSignal, compose, evaluateOutcome, replaySignals } from "./signals";
import { scoreInstrument } from "./scoring";

const ctxFor = (s: string) => buildContext(s, demoProvider.getCandles(s));

describe("demo data", () => {
  it("is deterministic and well-formed", () => {
    const a = demoProvider.getCandles("TCS");
    expect(a.length).toBe(320);
    for (const c of a) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close) - 1e-9);
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close) + 1e-9);
      expect(c.volume).toBeGreaterThan(0);
    }
    expect(demoProvider.getCandles("TCS")).toBe(a);
  });
});

describe("signal engine", () => {
  it("returns insufficient_data when history is too short", () => {
    const ctx = buildContext("X", demoProvider.getCandles("TCS").slice(0, 100));
    expect(compose(ctx, 99).status).toBe("insufficient_data");
  });

  it("is causal: truncating future bars never changes the signal at bar i", () => {
    for (const sym of ["RELIANCE", "TCS", "SBIN", "MARUTI"]) {
      const full = ctxFor(sym);
      for (const i of [230, 270, 300]) {
        const cut = buildContext(sym, full.candles.slice(0, i + 1));
        const a = compose(full, i);
        const b = compose(cut, i);
        expect(b.status).toBe(a.status);
        expect(b.primary?.meta.id).toBe(a.primary?.meta.id);
        expect(b.primary?.strength ?? 0).toBeCloseTo(a.primary?.strength ?? 0);
      }
    }
  });

  it("sets stop on the correct side of entry and targets in the signal direction", () => {
    let seen = 0;
    for (const inst of demoProvider.listInstruments()) {
      const ctx = ctxFor(inst.symbol);
      for (const s of replaySignals(ctx)) {
        seen++;
        const sign = s.direction === "bullish" ? 1 : -1;
        expect((s.entryRef - s.stop) * sign).toBeGreaterThan(0);
        for (const t of s.targets) expect((t.price - s.entryRef) * sign).toBeGreaterThan(0);
        expect(s.supporting.length).toBeGreaterThan(0);
        expect(s.source).toBe("demo-simulated");
      }
    }
    expect(seen).toBeGreaterThan(5);
  });

  it("evaluates outcomes only from bars after the signal, stop-first when ambiguous", () => {
    const ctx = ctxFor("SBIN");
    const sigs = replaySignals(ctx);
    for (const s of sigs) {
      const o = evaluateOutcome(ctx, s);
      expect(o.barsEvaluated).toBeLessThanOrEqual(s.horizonBars);
      if (o.status === "invalidated") expect(o.directionalMovePct).toBeLessThan(0);
    }
  });

  it("produces a mix of bullish, bearish and neutral states across the universe", () => {
    const states = new Set(demoProvider.listInstruments().filter((x) => x.kind === "equity").map((x) => { const c = ctxFor(x.symbol); return compose(c, c.candles.length - 1).status; }));
    expect(states.has("bullish")).toBe(true);
    expect(states.has("bearish")).toBe(true);
    expect(states.has("neutral")).toBe(true);
  });

  it("builds a record only for directional compositions", () => {
    const ctx = ctxFor("INFY");
    const comp = compose(ctx, ctx.candles.length - 1);
    if (comp.status === "neutral") expect(buildSignal(ctx, ctx.candles.length - 1, comp)).toBeNull();
  });
});

describe("scoring", () => {
  it("stays within 0..100 and renormalises when liquidity is missing", () => {
    const ctx = ctxFor("RELIANCE");
    const i = ctx.candles.length - 1;
    const withL = scoreInstrument(ctx, i, 0.8)!;
    const without = scoreInstrument(ctx, i, null)!;
    expect(withL.score).toBeGreaterThanOrEqual(0);
    expect(withL.score).toBeLessThanOrEqual(100);
    expect(without.score).toBeGreaterThanOrEqual(0);
    expect(without.factors.find((f) => f.key === "liquidity")!.value).toBeNull();
  });
});
