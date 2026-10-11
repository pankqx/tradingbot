import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ResearchQueue } from "@/components/research-queue";
import { Delta, SimBadge, Sparkline } from "@/components/ui";
import { breadth, equities, indices, toQueueRow } from "@/lib/data/queries";
import { allHistory, getUniverse } from "@/lib/data/universe";
import { price, shortDate } from "@/lib/format";

export const metadata = { title: "Overview" };

export default function OverviewPage() {
  const u = getUniverse();
  const idx = indices();
  const rows = equities().map(toQueueRow);
  const b = breadth();
  const lastIdx = u.contexts.get(idx[0].instrument.symbol)!.candles.length - 1;
  const invalidated = allHistory().filter((h) => h.outcome.status === "invalidated" && h.outcome.resolvedOn && lastIdx - u.contexts.get(h.symbol)!.candles.findIndex((c) => c.date === h.outcome.resolvedOn) <= 10).slice(0, 6);
  const asOf = shortDate(u.asOf, true);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[30px] leading-tight md:text-[36px]">Today’s research</h1>
          <p className="mt-1 text-[14px] text-ink-2">Setups from the end-of-day close on {asOf}, ranked by how well the evidence agrees.</p>
        </div>
        <SimBadge>Simulated data · no live feed</SimBadge>
      </div>

      <section aria-label="Market indices" className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {idx.map((s, k) => (
          <Link key={s.instrument.symbol} href={`/stocks/${encodeURIComponent(s.instrument.symbol)}`} className="row-hover flex items-center justify-between gap-4 px-1 py-4 sm:px-5 sm:first:pl-1" style={{ animation: `fade-in 400ms ease-out ${k * 90}ms both` }}>
            <div>
              <p className="text-[13px] text-ink-2">{s.instrument.name}</p>
              <p className="display num mt-1 text-[28px] leading-none">{price(s.quote.last)}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px]"><Delta value={s.quote.changePct} arrow /><span className="text-ink-3">simulated · close {shortDate(s.quote.asOf)}</span></p>
            </div>
            <Sparkline values={s.spark} width={116} height={44} />
          </Link>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px]">
        <ResearchQueue rows={rows} />
        <aside className="space-y-9" aria-label="Market context">
          <section>
            <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Market breadth</h2>
            <div className="space-y-4 pt-4 text-[13.5px]">
              <div>
                <div className="mb-1.5 flex justify-between"><span>Advancing vs declining</span><span className="num text-ink-2">{b.adv} / {b.dec}</span></div>
                <div className="flex h-2 overflow-hidden rounded-full bg-down/70"><div className="bar-grow h-full bg-up" style={{ width: `${(b.adv / b.n) * 100}%` }} /></div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between"><span>Above 50-day average</span><span className="num text-ink-2">{b.above50} of {b.n}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-line"><div className="bar-grow h-full bg-accent" style={{ width: `${(b.above50 / b.n) * 100}%` }} /></div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between"><span>Above 200-day average</span><span className="num text-ink-2">{b.above200} of {b.n}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-line"><div className="bar-grow h-full bg-accent" style={{ width: `${(b.above200 / b.n) * 100}%` }} /></div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[13px]">
                <dt className="text-ink-2">Trending up</dt><dd className="num text-right">{b.regimes.trending_up}</dd>
                <dt className="text-ink-2">Trending down</dt><dd className="num text-right">{b.regimes.trending_down}</dd>
                <dt className="text-ink-2">Range-bound</dt><dd className="num text-right">{b.regimes.ranging}</dd>
                <dt className="text-ink-2">Transitional</dt><dd className="num text-right">{b.regimes.transition}</dd>
              </dl>
            </div>
          </section>

          <section>
            <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Recently invalidated</h2>
            {invalidated.length === 0 ? <p className="py-4 text-[13.5px] text-ink-2">No stop levels were hit in the last 10 bars.</p> : (
              <ul className="divide-y divide-line">
                {invalidated.map((h) => (
                  <li key={h.id}>
                    <Link href={`/signals/${encodeURIComponent(h.id)}`} className="row-hover flex items-center justify-between gap-3 py-2.5">
                      <span><span className="block text-[13.5px] font-medium">{h.symbol} <span className="font-normal text-ink-3">{h.direction}</span></span><span className="block text-[12.5px] text-ink-3">{h.strategy.name} · stopped {shortDate(h.outcome.resolvedOn!)}</span></span>
                      <ArrowUpRight className="size-4 text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-[14px] font-semibold">Read the method before the signals</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">Every setup comes from four published rules and a six-factor score. Failed signals stay in the ledger. Nothing here predicts prices.</p>
            <Link href="/methodology" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-accent hover:underline">See how signals are built <ArrowUpRight className="size-3.5" /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
