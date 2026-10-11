/**
 * Deterministic, SIMULATED market data. Prices are generated from a seeded
 * random walk with per-symbol scenarios. They do NOT represent real quotes.
 */
import type { Candle } from "@/lib/analytics/types";
import type { Instrument, MarketDataProvider, Quote } from "./types";

/** Last simulated trading day; fixed so the demo is reproducible. */
export const DEMO_LAST_BAR = "2026-10-09";
export const DEMO_BARS = 320;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Business-day dates (Mon-Fri) ending at DEMO_LAST_BAR. Exchange holidays are not modelled. */
function tradingDates(count: number, last: string): string[] {
  const out: string[] = [];
  const d = new Date(`${last}T00:00:00Z`);
  while (out.length < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

interface Segment {
  bars: number;
  /** Daily drift, fraction. */
  drift: number;
  /** Daily volatility, fraction. */
  vol: number;
  /** Volume multiplier for this segment. */
  volume?: number;
}

interface Scenario {
  seed: number;
  /** Final simulated close the series is scaled to. */
  base: number;
  baseVolume: number;
  segments: Segment[];
}

const T = DEMO_BARS;

function scenario(seed: number, base: number, baseVolume: number, segments: Segment[]): Scenario {
  const used = segments.reduce((s, x) => s + x.bars, 0);
  const pad: Segment[] = used < T ? [{ bars: T - used, drift: 0.0003, vol: 0.011 }] : [];
  return { seed, base, baseVolume, segments: [...pad, ...segments] };
}

const S: Record<string, Scenario> = {
  RELIANCE: scenario(11, 2650, 6.5e6, [{ bars: 200, drift: 0.0006, vol: 0.011 }, { bars: 80, drift: 0.0008, vol: 0.009 }, { bars: 3, drift: 0.012, vol: 0.004, volume: 2.6 }]),
  TCS: scenario(12, 3700, 2.1e6, [{ bars: 220, drift: -0.0002, vol: 0.011 }, { bars: 70, drift: -0.0011, vol: 0.011 }, { bars: 3, drift: -0.012, vol: 0.004, volume: 2.4 }]),
  HDFCBANK: scenario(13, 1500, 1.4e7, [{ bars: 240, drift: 0.0005, vol: 0.010 }, { bars: 70, drift: 0.0007, vol: 0.008 }, { bars: 7, drift: 0.0004, vol: 0.007 }]),
  INFY: scenario(14, 1650, 7.5e6, [{ bars: 230, drift: 0.0000, vol: 0.012 }, { bars: 80, drift: 0.0000, vol: 0.006 }]),
  ICICIBANK: scenario(15, 1100, 1.2e7, [{ bars: 250, drift: 0.0007, vol: 0.011 }, { bars: 60, drift: 0.0009, vol: 0.010 }, { bars: 4, drift: -0.012, vol: 0.006 }]),
  SBIN: scenario(16, 700, 1.9e7, [{ bars: 235, drift: 0.0008, vol: 0.013 }, { bars: 70, drift: 0.0010, vol: 0.012 }, { bars: 4, drift: -0.014, vol: 0.006, volume: 1.4 }]),
  BHARTIARTL: scenario(17, 1300, 4.2e6, [{ bars: 240, drift: 0.0009, vol: 0.010 }, { bars: 70, drift: 0.0011, vol: 0.009 }]),
  ITC: scenario(18, 440, 1.3e7, [{ bars: 230, drift: 0.0001, vol: 0.009 }, { bars: 90, drift: -0.0001, vol: 0.006 }]),
  LT: scenario(19, 3300, 2.0e6, [{ bars: 245, drift: 0.0006, vol: 0.011 }, { bars: 65, drift: 0.0004, vol: 0.010 }, { bars: 10, drift: -0.0075, vol: 0.006 }]),
  HINDUNILVR: scenario(20, 2600, 1.6e6, [{ bars: 230, drift: -0.0003, vol: 0.008 }, { bars: 90, drift: -0.0007, vol: 0.007 }]),
  TATAMOTORS: scenario(21, 880, 1.1e7, [{ bars: 250, drift: 0.0005, vol: 0.016 }, { bars: 62, drift: 0.0012, vol: 0.017 }, { bars: 8, drift: 0.006, vol: 0.012, volume: 1.8 }]),
  SUNPHARMA: scenario(22, 1650, 2.8e6, [{ bars: 240, drift: 0.0007, vol: 0.010 }, { bars: 78, drift: 0.0006, vol: 0.009 }, { bars: 2, drift: -0.02, vol: 0.004 }]),
  MARUTI: scenario(23, 11800, 4.2e5, [{ bars: 240, drift: 0.0004, vol: 0.010 }, { bars: 75, drift: -0.0004, vol: 0.009 }, { bars: 5, drift: -0.003, vol: 0.008 }]),
  ASIANPAINT: scenario(24, 2900, 1.6e6, [{ bars: 220, drift: -0.0005, vol: 0.010 }, { bars: 90, drift: -0.0009, vol: 0.009 }, { bars: 10, drift: 0.0005, vol: 0.008 }]),
  BAJFINANCE: scenario(25, 6600, 1.4e6, [{ bars: 240, drift: 0.0006, vol: 0.014 }, { bars: 78, drift: 0.0010, vol: 0.012 }, { bars: 2, drift: 0.018, vol: 0.004, volume: 2.8 }]),
  ADANIENT: scenario(26, 2400, 3.4e6, [{ bars: 240, drift: 0.0000, vol: 0.020 }, { bars: 80, drift: -0.0009, vol: 0.021 }]),
  AXISBANK: scenario(27, 1050, 6.8e6, [{ bars: 245, drift: 0.0003, vol: 0.011 }, { bars: 70, drift: 0.0002, vol: 0.010 }, { bars: 5, drift: -0.006, vol: 0.006 }]),
  KOTAKBANK: scenario(28, 1850, 3.1e6, [{ bars: 250, drift: 0.0000, vol: 0.010 }, { bars: 70, drift: 0.0000, vol: 0.008 }]),
  WIPRO: scenario(29, 480, 5.2e6, [{ bars: 240, drift: -0.0001, vol: 0.011 }, { bars: 78, drift: 0.0001, vol: 0.010 }, { bars: 2, drift: 0.015, vol: 0.004, volume: 2.2 }]),
  TITAN: scenario(30, 3300, 1.2e6, [{ bars: 230, drift: 0.0005, vol: 0.012 }, { bars: 85, drift: 0.0001, vol: 0.009 }]),
  "NIFTY 50": scenario(41, 24300, 2.5e8, [{ bars: 300, drift: 0.0004, vol: 0.0075 }, { bars: 20, drift: 0.0006, vol: 0.006 }]),
  "NIFTY BANK": scenario(42, 51800, 1.1e8, [{ bars: 300, drift: 0.0003, vol: 0.0095 }, { bars: 20, drift: 0.0000, vol: 0.008 }]),
  SENSEX: scenario(43, 80100, 1.4e5, [{ bars: 300, drift: 0.0004, vol: 0.0072 }, { bars: 20, drift: 0.0006, vol: 0.006 }]),
};

const INSTRUMENTS: Instrument[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", kind: "equity" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT", kind: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", sector: "Banking", kind: "equity" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE", sector: "IT", kind: "equity" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Banking", kind: "equity" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking", kind: "equity" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", kind: "equity" },
  { symbol: "ITC", name: "ITC", exchange: "NSE", sector: "FMCG", kind: "equity" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE", sector: "Capital Goods", kind: "equity" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE", sector: "FMCG", kind: "equity" },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Auto", kind: "equity" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE", sector: "Pharma", kind: "equity" },
  { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE", sector: "Auto", kind: "equity" },
  { symbol: "ASIANPAINT", name: "Asian Paints", exchange: "NSE", sector: "Consumer", kind: "equity" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", exchange: "NSE", sector: "Financials", kind: "equity" },
  { symbol: "ADANIENT", name: "Adani Enterprises", exchange: "NSE", sector: "Infrastructure", kind: "equity" },
  { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE", sector: "Banking", kind: "equity" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE", sector: "Banking", kind: "equity" },
  { symbol: "WIPRO", name: "Wipro", exchange: "NSE", sector: "IT", kind: "equity" },
  { symbol: "TITAN", name: "Titan Company", exchange: "NSE", sector: "Consumer", kind: "equity" },
  { symbol: "NIFTY 50", name: "Nifty 50", exchange: "NSE", sector: "Index", kind: "index" },
  { symbol: "NIFTY BANK", name: "Nifty Bank", exchange: "NSE", sector: "Index", kind: "index" },
  { symbol: "SENSEX", name: "S&P BSE Sensex", exchange: "BSE", sector: "Index", kind: "index" },
];

function generate(sc: Scenario): Candle[] {
  const rand = mulberry32(sc.seed);
  const dates = tradingDates(T, DEMO_LAST_BAR);
  const candles: Candle[] = [];
  let price = 1000; // arbitrary start; series is rescaled to end at sc.base
  let idx = 0;
  for (const seg of sc.segments) {
    for (let b = 0; b < seg.bars && idx < T; b++, idx++) {
      const open = price * (1 + gaussian(rand) * seg.vol * 0.25);
      const ret = seg.drift + gaussian(rand) * seg.vol;
      const close = Math.max(open * (1 + ret), 1);
      const range = Math.abs(gaussian(rand)) * seg.vol * 0.55 + seg.vol * 0.15;
      const high = Math.max(open, close) * (1 + range * rand());
      const low = Math.min(open, close) * (1 - range * rand());
      const volNoise = Math.exp(gaussian(rand) * 0.28);
      const volume = Math.round(sc.baseVolume * (seg.volume ?? 1) * volNoise * (1 + Math.abs(ret) * 18));
      candles.push({
        date: dates[idx],
        open: round(open),
        high: round(high),
        low: round(low),
        close: round(close),
        volume,
      });
      price = close;
    }
  }
  // Rescale so each series ends at its configured level (sc.base = final close).
  const k = sc.base / candles[candles.length - 1].close;
  return candles.map((c) => ({
    ...c,
    open: round(c.open * k), high: round(c.high * k), low: round(c.low * k), close: round(c.close * k),
  }));
}

const round = (n: number) => Math.round(n * 100) / 100;

const cache = new Map<string, Candle[]>();

export const demoProvider: MarketDataProvider = {
  id: "demo-simulated",
  label: "Simulated demo data",
  simulated: true,
  listInstruments: () => INSTRUMENTS,
  getCandles(symbol) {
    const sc = S[symbol];
    if (!sc) return [];
    let c = cache.get(symbol);
    if (!c) {
      c = generate(sc);
      cache.set(symbol, c);
    }
    return c;
  },
  getQuote(symbol): Quote | null {
    const c = this.getCandles(symbol);
    if (c.length < 2) return null;
    const last = c[c.length - 1];
    const prev = c[c.length - 2];
    return {
      symbol,
      last: last.close,
      prevClose: prev.close,
      change: round(last.close - prev.close),
      changePct: ((last.close - prev.close) / prev.close) * 100,
      asOf: `${last.date}T15:30:00+05:30`,
      source: "demo-simulated",
      simulated: true,
    };
  },
};
