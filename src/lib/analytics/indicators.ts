/**
 * Pure, causal technical-indicator functions.
 * Every value at index i depends only on inputs at indices <= i (no look-ahead),
 * which the test-suite verifies by truncation.
 */
import type { Series } from "./types";

export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** EMA seeded with the SMA of the first `period` values. */
export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's RSI. */
export function rsi(close: number[], period = 14): Series {
  const out: Series = new Array(close.length).fill(null);
  if (close.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = close[i] - close[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  hist: Series;
}

export function macd(close: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const f = ema(close, fast);
  const s = ema(close, slow);
  const line: Series = close.map((_, i) => (f[i] != null && s[i] != null ? f[i]! - s[i]! : null));
  const firstIdx = line.findIndex((v) => v != null);
  const signal: Series = new Array(close.length).fill(null);
  if (firstIdx >= 0) {
    const tail = line.slice(firstIdx).map((v) => v as number);
    const sig = ema(tail, signalPeriod);
    for (let i = 0; i < sig.length; i++) signal[firstIdx + i] = sig[i];
  }
  const hist: Series = close.map((_, i) =>
    line[i] != null && signal[i] != null ? line[i]! - signal[i]! : null,
  );
  return { macd: line, signal, hist };
}

export function trueRange(high: number[], low: number[], close: number[]): number[] {
  return high.map((h, i) =>
    i === 0 ? h - low[i] : Math.max(h - low[i], Math.abs(h - close[i - 1]), Math.abs(low[i] - close[i - 1])),
  );
}

/** Wilder's ATR (seeded with the mean of the first `period` true ranges after bar 0). */
export function atr(high: number[], low: number[], close: number[], period = 14): Series {
  const out: Series = new Array(close.length).fill(null);
  if (close.length <= period) return out;
  const tr = trueRange(high, low, close);
  let prev = 0;
  for (let i = 1; i <= period; i++) prev += tr[i];
  prev /= period;
  out[period] = prev;
  for (let i = period + 1; i < close.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

export interface AdxResult {
  adx: Series;
  plusDI: Series;
  minusDI: Series;
}

/** Wilder's ADX / directional indicators. */
export function adx(high: number[], low: number[], close: number[], period = 14): AdxResult {
  const n = close.length;
  const adxS: Series = new Array(n).fill(null);
  const plus: Series = new Array(n).fill(null);
  const minus: Series = new Array(n).fill(null);
  if (n <= period * 2) return { adx: adxS, plusDI: plus, minusDI: minus };
  const tr = trueRange(high, low, close);
  const pdm: number[] = new Array(n).fill(0);
  const mdm: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = high[i] - high[i - 1];
    const down = low[i - 1] - low[i];
    pdm[i] = up > down && up > 0 ? up : 0;
    mdm[i] = down > up && down > 0 ? down : 0;
  }
  let sTR = 0;
  let sP = 0;
  let sM = 0;
  for (let i = 1; i <= period; i++) {
    sTR += tr[i];
    sP += pdm[i];
    sM += mdm[i];
  }
  const dx: number[] = new Array(n).fill(0);
  const setDI = (i: number) => {
    plus[i] = sTR === 0 ? 0 : (100 * sP) / sTR;
    minus[i] = sTR === 0 ? 0 : (100 * sM) / sTR;
    const sum = plus[i]! + minus[i]!;
    dx[i] = sum === 0 ? 0 : (100 * Math.abs(plus[i]! - minus[i]!)) / sum;
  };
  setDI(period);
  for (let i = period + 1; i < n; i++) {
    sTR = sTR - sTR / period + tr[i];
    sP = sP - sP / period + pdm[i];
    sM = sM - sM / period + mdm[i];
    setDI(i);
  }
  let a = 0;
  for (let i = period; i < period * 2; i++) a += dx[i];
  a /= period;
  adxS[period * 2 - 1] = a;
  for (let i = period * 2; i < n; i++) {
    a = (a * (period - 1) + dx[i]) / period;
    adxS[i] = a;
  }
  return { adx: adxS, plusDI: plus, minusDI: minus };
}

export interface BollingerResult {
  mid: Series;
  upper: Series;
  lower: Series;
  /** (upper - lower) / mid */
  bandwidth: Series;
}

/** Bollinger Bands using the population standard deviation. */
export function bollinger(close: number[], period = 20, k = 2): BollingerResult {
  const mid = sma(close, period);
  const upper: Series = new Array(close.length).fill(null);
  const lower: Series = new Array(close.length).fill(null);
  const bandwidth: Series = new Array(close.length).fill(null);
  for (let i = period - 1; i < close.length; i++) {
    const m = mid[i]!;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) v += (close[j] - m) ** 2;
    const sd = Math.sqrt(v / period);
    upper[i] = m + k * sd;
    lower[i] = m - k * sd;
    bandwidth[i] = m === 0 ? null : (2 * k * sd) / m;
  }
  return { mid, upper, lower, bandwidth };
}

/** Highest value of the `period` bars BEFORE index i (excludes bar i). */
export function priorHighest(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    let m = -Infinity;
    for (let j = i - period; j < i; j++) m = Math.max(m, values[j]);
    out[i] = m;
  }
  return out;
}

/** Lowest value of the `period` bars BEFORE index i (excludes bar i). */
export function priorLowest(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    let m = Infinity;
    for (let j = i - period; j < i; j++) m = Math.min(m, values[j]);
    out[i] = m;
  }
  return out;
}

/** Volume relative to the average of the `period` PRIOR bars. */
export function relativeVolume(volume: number[], period = 20): Series {
  const out: Series = new Array(volume.length).fill(null);
  for (let i = period; i < volume.length; i++) {
    let s = 0;
    for (let j = i - period; j < i; j++) s += volume[j];
    const avg = s / period;
    out[i] = avg === 0 ? null : volume[i] / avg;
  }
  return out;
}

/** Percentile rank (0..1) of values[i] within the previous `window` values (inclusive of i). */
export function rollingPercentile(values: Series, window: number): Series {
  const out: Series = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) continue;
    const start = Math.max(0, i - window + 1);
    let below = 0;
    let count = 0;
    for (let j = start; j <= i; j++) {
      const x = values[j];
      if (x == null) continue;
      count++;
      if (x <= v) below++;
    }
    if (count >= Math.min(window, 30)) out[i] = below / count;
  }
  return out;
}
