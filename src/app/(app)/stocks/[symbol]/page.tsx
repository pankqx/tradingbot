import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import { DirectionPill, Delta, ScoreMeter, SimBadge } from "@/components/ui";
import { StarButton } from "@/components/watchlist";
import { regimeLabel } from "@/lib/analytics/signals";
import { getSnapshot, getUniverse } from "@/lib/data/universe";
import { crore, OUTCOME_LABEL, price, shortDate, signedPct } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getUniverse().snapshots.map((s) => ({ symbol: s.instrument.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/stocks/[symbol]">) {
  const { symbol } = await params;
  return { title: decodeURIComponent(symbol) };
}

export default async function StockPage({ params }: PageProps<"/stocks/[symbol]">) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw);
  const snap = getSnapshot(symbol);
  if (!snap) notFound();
  const ctx = getUniverse().contexts.get(symbol)!;
  const n = ctx.candles.length;
  const sig = snap.signal;
  const year = ctx.candles.slice(-252);
  const hi52 = Math.max(...year.map((c) => c.high)), lo52 = Math.min(...year.map((c) => c.low));
  const ind = { sma20: ctx.sma20, sma50: ctx.sma50, sma200: ctx.sma200, bbUpper: ctx.bbUpper, bbLower: ctx.bbLower, bbMid: ctx.bbMid, rsi: ctx.rsi14, macdLine: ctx.macdLine, macdSignal: ctx.macdSignal, macdHist: ctx.macdHist };
  const markers = snap.history.map((h) => ({ date: h.generatedOn, direction: h.direction, label: "" }));
  const tone = snap.status === "bullish" ? "bullish" : snap.status === "bearish" ? "bearish" : "neutral";
  const pos52 = ((snap.quote.last - lo52) / (hi52 - lo52)) * 100;

  const rows: [string, string, string?][] = [
    ["RSI (14)", snap.rsi != null ? snap.rsi.toFixed(1) : "—", snap.rsi != null ? (snap.rsi > 70 ? "Stretched high" : snap.rsi < 30 ? "Stretched low" : snap.rsi >= 50 ? "Above midline" : "Below midline") : undefined],
    ["ADX (14)", snap.adx != null ? snap.adx.toFixed(1) : "—", snap.adx != null ? (snap.adx >= 25 ? "Trending" : snap.adx < 20 ? "Weak trend" : "Developing") : undefined],
    ["ATR as % of price", snap.atrPct != null ? `${snap.atrPct.toFixed(2)}%` : "—", "Typical daily range"],
    ["Relative volume", snap.relVol != null ? `${snap.relVol.toFixed(2)}×` : "—", "vs prior 20 days"],
    ["SMA 50", snap.sma50 != null ? price(snap.sma50) : "—", snap.aboveSma50 == null ? undefined : snap.aboveSma50 ? "Price above" : "Price below"],
    ["SMA 200", snap.sma200 != null ? price(snap.sma200) : "—", snap.aboveSma200 == null ? undefined : snap.aboveSma200 ? "Price above" : "Price below"],
    ["1-month return", snap.ret1m != null ? signedPct(snap.ret1m) : "—"],
    ["3-month return", snap.ret3m != null ? signedPct(snap.ret3m) : "—"],
    ["Regime", snap.regime ? regimeLabel(snap.regime) : "—"],
    ["Avg daily turnover", snap.instrument.kind === "equity" ? crore(snap.turnover) : "n/a"],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-3">{snap.instrument.name} · {snap.instrument.sector} · {snap.instrument.exchange}</p>
          <h1 className="display text-[34px] leading-tight md:text-[44px]">{symbol}</h1>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display num text-[28px]">{price(snap.quote.last)}</span>
            <span className="num text-[15px]"><span className={snap.quote.change >= 0 ? "text-up" : "text-down"}>{snap.quote.change >= 0 ? "+" : "−"}{price(Math.abs(snap.quote.change))}</span> <Delta value={snap.quote.changePct} arrow /></span>
            <span className="text-[13px] text-ink-3">close {shortDate(snap.quote.asOf, true)}</span>
            <SimBadge />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StarButton symbol={symbol} className="border border-line" />
          {sig && <Link href={`/signals/${encodeURIComponent(sig.id)}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[13.5px] font-medium text-accent-ink hover:opacity-90">Open the setup <ArrowUpRight className="size-3.5" /></Link>}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PriceChart candles={ctx.candles} ind={ind} symbol={symbol}
          setup={sig ? { direction: sig.direction, entry: sig.entryRef, stop: sig.stop, targets: sig.targets.map((t) => ({ label: t.label, price: t.price })), fromDate: sig.generatedOn } : null}
          markers={markers} />

        <aside className="space-y-7" aria-label="Research read">
          <section>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h2 className="text-[14px] font-semibold">Current read</h2>
              <DirectionPill status={snap.status} conflicted={snap.conflicted} />
            </div>
            {snap.score && (
              <div className="space-y-3 pt-3.5">
                <div className="flex items-center justify-between text-[13.5px]"><span className="text-ink-2">Research score <span className="text-ink-3">(lean {snap.score.lean})</span></span><ScoreMeter score={snap.score.score} tone={tone} /></div>
                <ul className="space-y-2.5">
                  {snap.score.factors.map((f) => (
                    <li key={f.key} title={f.note}>
                      <div className="flex justify-between text-[12.5px]"><span>{f.label} <span className="text-ink-3">· weight {Math.round(f.weight * 100)}%</span></span><span className="num text-ink-2">{f.value == null ? "n/a" : Math.round(f.value * 100)}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"><div className="bar-grow h-full rounded-full bg-accent" style={{ width: `${(f.value ?? 0) * 100}%` }} /></div>
                      <p className="mt-0.5 text-[12px] text-ink-3">{f.note}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-[12.5px] leading-relaxed text-ink-3">The score shows how well the evidence lines up. It is not a chance of profit.</p>
              </div>
            )}
          </section>

          {sig ? (
            <section>
              <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">{sig.strategy.name}</h2>
              <p className="pt-3 text-[13px] font-medium text-up">Supporting</p>
              <ul className="mt-1 space-y-2 text-[13.5px]">{sig.supporting.slice(0, 4).map((e, i) => <li key={i}><span className="font-medium">{e.label}.</span> <span className="text-ink-2">{e.detail}</span></li>)}</ul>
              <p className="pt-4 text-[13px] font-medium text-down">Against</p>
              {sig.conflicting.length === 0 ? <p className="mt-1 text-[13.5px] text-ink-2">No conflicting evidence from the other rules.</p> : <ul className="mt-1 space-y-2 text-[13.5px]">{sig.conflicting.slice(0, 4).map((e, i) => <li key={i}><span className="font-medium">{e.label}.</span> <span className="text-ink-2">{e.detail}</span></li>)}</ul>}
            </section>
          ) : (
            <section>
              <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">No active setup</h2>
              <p className="pt-3 text-[13.5px] leading-relaxed text-ink-2">{snap.conflicted ? "Two rules point in opposite directions, so no hypothesis is issued." : "None of the four rules is triggering on the latest close. The engine does not force a signal when the evidence is thin."}</p>
            </section>
          )}
        </aside>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Indicators and context</h2>
          <dl className="divide-y divide-line">
            {rows.map(([k, v, note]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2 text-[13.5px]"><dt className="text-ink-2">{k}</dt><dd className="num text-right font-medium">{v}{note && <span className="ml-2 text-[12.5px] font-normal text-ink-3">{note}</span>}</dd></div>
            ))}
          </dl>
          <div className="pt-4">
            <div className="flex justify-between text-[12.5px] text-ink-3"><span>52-week low {price(lo52)}</span><span>high {price(hi52)}</span></div>
            <div className="relative mt-1.5 h-1.5 rounded-full bg-line"><span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink" style={{ left: `${pos52}%` }} /></div>
          </div>
        </section>

        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Signal history for {symbol}</h2>
          {snap.history.length === 0 ? <p className="py-4 text-[13.5px] text-ink-2">No setups were generated in the last 100 bars.</p> : (
            <ul className="divide-y divide-line">
              {[...snap.history].reverse().slice(0, 8).map((h) => (
                <li key={h.id}><Link href={`/signals/${encodeURIComponent(h.id)}`} className="row-hover flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                  <span><span className="font-medium">{shortDate(h.generatedOn)}</span> <span className={h.direction === "bullish" ? "text-up" : "text-down"}>{h.direction}</span> <span className="text-ink-3">· {h.strategy.name}</span></span>
                  <span className="text-[12.5px] text-ink-2">{OUTCOME_LABEL[h.outcome.status]}</span>
                </Link></li>
              ))}
            </ul>
          )}
          <h2 className="mt-8 border-b border-line pb-2.5 text-[14px] font-semibold">Fundamentals and news</h2>
          <p className="py-3 text-[13.5px] leading-relaxed text-ink-2">Not shown. Reliable company fundamentals and news need a licensed data provider, and this demo does not invent them. See <Link className="text-accent underline-offset-2 hover:underline" href="/methodology#data">data sources</Link>.</p>
        </section>
      </div>
      <p className="sr-only">{n} daily bars loaded.</p>
    </div>
  );
}
