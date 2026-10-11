import { describe, expect, it } from "vitest";
import {
  adx, atr, bollinger, ema, macd, priorHighest, relativeVolume, rsi, sma,
} from "./indicators";

const close = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 6) * 8 + i * 0.1);
const high = close.map((c) => c + 1.5);
const low = close.map((c) => c - 1.5);

describe("sma", () => {
  it("matches hand calculation and warm-up nulls", () => {
    const r = sma([1, 2, 3, 4, 5], 3);
    expect(r).toEqual([null, null, 2, 3, 4]);
  });
});

describe("ema", () => {
  it("seeds with SMA and applies k=2/(n+1)", () => {
    const r = ema([1, 2, 3, 4], 3);
    expect(r[2]).toBeCloseTo(2);
    expect(r[3]).toBeCloseTo(4 * 0.5 + 2 * 0.5); // k = 0.5
  });
  it("is constant for constant input", () => {
    const r = ema(new Array(30).fill(7), 10);
    expect(r[29]).toBeCloseTo(7);
  });
});

describe("rsi", () => {
  it("is 100 for strictly rising prices and 0 for strictly falling", () => {
    const up = Array.from({ length: 40 }, (_, i) => 10 + i);
    const down = Array.from({ length: 40 }, (_, i) => 100 - i);
    expect(rsi(up)[39]).toBe(100);
    expect(rsi(down)[39]).toBeCloseTo(0, 5);
  });
  it("stays within 0..100", () => {
    for (const v of rsi(close)) if (v != null) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(100);
  });
});

describe("macd", () => {
  it("is zero for constant prices", () => {
    const m = macd(new Array(80).fill(50));
    expect(m.macd[79]).toBeCloseTo(0);
    expect(m.hist[79]).toBeCloseTo(0);
  });
  it("hist = macd - signal", () => {
    const m = macd(close);
    const i = 100;
    expect(m.hist[i]).toBeCloseTo(m.macd[i]! - m.signal[i]!);
  });
});

describe("atr", () => {
  it("equals the constant bar range for constant-range bars", () => {
    const h = new Array(40).fill(11);
    const l = new Array(40).fill(9);
    const c = new Array(40).fill(10);
    expect(atr(h, l, c)[39]).toBeCloseTo(2);
  });
});

describe("adx", () => {
  it("is high for a clean trend and low for a flat market", () => {
    const t = Array.from({ length: 100 }, (_, i) => 100 + i * 2);
    const trend = adx(t.map((x) => x + 1), t.map((x) => x - 1), t);
    expect(trend.adx[99]!).toBeGreaterThan(40);
    expect(trend.plusDI[99]!).toBeGreaterThan(trend.minusDI[99]!);
    const flat = Array.from({ length: 100 }, (_, i) => 100 + (i % 2 ? 0.5 : -0.5));
    const f = adx(flat.map((x) => x + 1), flat.map((x) => x - 1), flat);
    expect(f.adx[99]!).toBeLessThan(20);
  });
});

describe("bollinger", () => {
  it("collapses to the mean for constant prices", () => {
    const b = bollinger(new Array(40).fill(25));
    expect(b.upper[39]).toBeCloseTo(25);
    expect(b.lower[39]).toBeCloseTo(25);
  });
  it("uses population standard deviation", () => {
    const b = bollinger([1, 2, 3, 4, 5], 5, 2);
    const sd = Math.sqrt(2); // population sd of 1..5
    expect(b.upper[4]).toBeCloseTo(3 + 2 * sd);
  });
});

describe("helpers", () => {
  it("priorHighest excludes the current bar", () => {
    expect(priorHighest([1, 5, 3, 9], 2)).toEqual([null, null, 5, 5]);
  });
  it("relativeVolume compares to prior average only", () => {
    expect(relativeVolume([10, 10, 30], 2)[2]).toBeCloseTo(3);
  });
});

describe("causality (no look-ahead)", () => {
  it("indicator values at i are unchanged when future bars are removed", () => {
    const i = 90;
    const full = { r: rsi(close), m: macd(close), a: atr(high, low, close), d: adx(high, low, close), b: bollinger(close) };
    const cut = close.slice(0, i + 1);
    const ch = high.slice(0, i + 1);
    const cl = low.slice(0, i + 1);
    expect(rsi(cut)[i]).toBeCloseTo(full.r[i]!);
    expect(macd(cut).hist[i]).toBeCloseTo(full.m.hist[i]!);
    expect(atr(ch, cl, cut)[i]).toBeCloseTo(full.a[i]!);
    expect(adx(ch, cl, cut).adx[i]).toBeCloseTo(full.d.adx[i]!);
    expect(bollinger(cut).upper[i]).toBeCloseTo(full.b.upper[i]!);
  });
});
