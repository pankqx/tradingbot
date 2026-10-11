import { Screener, type ScreenerRow } from "@/components/screener";
import { SimBadge } from "@/components/ui";
import { equities } from "@/lib/data/queries";

export const metadata = { title: "Discover stocks" };

export default function DiscoverPage() {
  const rows: ScreenerRow[] = equities().map((s) => ({
    symbol: s.instrument.symbol, name: s.instrument.name, sector: s.instrument.sector, status: s.status, conflicted: s.conflicted,
    strategy: s.signal?.strategy.name ?? null, score: s.score?.score ?? null, lean: s.score?.lean ?? null,
    last: s.quote.last, changePct: s.quote.changePct, rsi: s.rsi, adx: s.adx, relVol: s.relVol, atrPct: s.atrPct, aboveSma200: s.aboveSma200, ret1m: s.ret1m, turnover: s.turnover,
  }));
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[30px] leading-tight md:text-[36px]">Discover stocks</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-2">Filter the universe on trend, momentum, volume and volatility. Every figure is calculated from the daily candles on this site.</p>
        </div>
        <SimBadge>Simulated data</SimBadge>
      </div>
      <Screener rows={rows} />
    </div>
  );
}
