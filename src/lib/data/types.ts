import type { Candle } from "@/lib/analytics/types";

export interface Instrument {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  kind: "equity" | "index";
}

export interface Quote {
  symbol: string;
  last: number;
  prevClose: number;
  change: number;
  changePct: number;
  /** ISO timestamp of the last bar used to build this quote. */
  asOf: string;
  source: string;
  simulated: boolean;
}

/** Provider contract. A live adapter must implement the same shape and never fall back to demo data silently. */
export interface MarketDataProvider {
  readonly id: string;
  readonly label: string;
  readonly simulated: boolean;
  listInstruments(): Instrument[];
  getCandles(symbol: string): Candle[];
  getQuote(symbol: string): Quote | null;
}
