import type { QueueRow } from "@/components/research-queue";
import { getUniverse, type Snapshot } from "./universe";

export const equities = (): Snapshot[] => getUniverse().snapshots.filter((s) => s.instrument.kind === "equity");
export const indices = (): Snapshot[] => getUniverse().snapshots.filter((s) => s.instrument.kind === "index");

export function toQueueRow(s: Snapshot): QueueRow {
  return {
    symbol: s.instrument.symbol, name: s.instrument.name, sector: s.instrument.sector,
    status: s.status, conflicted: s.conflicted, strategy: s.signal?.strategy.name ?? null,
    score: s.score?.score ?? null, lean: s.score?.lean ?? null,
    last: s.quote.last, changePct: s.quote.changePct, riskPct: s.signal ? (Math.abs(s.signal.entryRef - s.signal.stop) / s.signal.entryRef) * 100 : null,
    ret1m: s.ret1m, spark: s.spark,
  };
}

export function breadth() {
  const eq = equities();
  const n = eq.length;
  const adv = eq.filter((s) => s.quote.changePct > 0).length;
  const above50 = eq.filter((s) => s.aboveSma50).length;
  const above200 = eq.filter((s) => s.aboveSma200).length;
  const regimes = { trending_up: 0, trending_down: 0, ranging: 0, transition: 0 };
  for (const s of eq) if (s.regime) regimes[s.regime]++;
  return { n, adv, dec: n - adv, above50, above200, regimes };
}
