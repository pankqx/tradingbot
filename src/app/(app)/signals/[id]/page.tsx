import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceChart } from "@/components/price-chart";
import { RiskLadder } from "@/components/risk-ladder";
import { SimBadge } from "@/components/ui";
import { explainSignal } from "@/lib/analytics/explain";
import { regimeLabel, STRATEGIES, classifyRegime } from "@/lib/analytics/signals";
import { allHistory, findSignal, getUniverse } from "@/lib/data/universe";
import { OUTCOME_LABEL, price, shortDate } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  const u = getUniverse();
  const ids = new Set<string>();
  for (const s of u.snapshots) { if (s.signal) ids.add(s.signal.id); s.history.forEach((h) => ids.add(h.id)); }
  return [...ids].map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/signals/[id]">) {
  const { id } = await params;
  const s = findSignal(id);
  return { title: s ? `${s.symbol} ${s.direction} setup` : "Signal" };
}

const MIN_SAMPLE = 30;

export default async function SignalPage({ params }: PageProps<"/signals/[id]">) {
  const { id } = await params;
  const s = findSignal(id);
  if (!s) notFound();
  const u = getUniverse();
  const ctx = u.contexts.get(s.symbol)!;
  const meta = STRATEGIES[s.strategy.id];
  const reg = classifyRegime(ctx, s.barIndex);
  const ind = { sma20: ctx.sma20, sma50: ctx.sma50, sma200: ctx.sma200, bbUpper: ctx.bbUpper, bbLower: ctx.bbLower, bbMid: ctx.bbMid, rsi: ctx.rsi14, macdLine: ctx.macdLine, macdSignal: ctx.macdSignal, macdHist: ctx.macdHist };
  const same = allHistory().filter((h) => h.strategy.id === s.strategy.id && h.outcome.status !== "active");
  const wins = same.filter((h) => h.outcome.status === "target_reached").length;
  const long = s.direction === "bullish";
  const riskPct = (Math.abs(s.entryRef - s.stop) / s.entryRef) * 100;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3"><Link href="/signals" className="hover:underline">Signals</Link> / <Link href={`/stocks/${encodeURIComponent(s.symbol)}`} className="hover:underline">{s.symbol}</Link></nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[30px] leading-tight md:text-[40px]">{s.symbol} <span className={long ? "text-up" : "text-down"}>{long ? "bullish" : "bearish"}</span> hypothesis</h1>
          <p className="mt-1 text-[14px] text-ink-2">{s.strategy.name} v{s.strategy.version} · daily bars · generated {shortDate(s.generatedOn, true)} from data through the same close</p>
        </div>
        <div className="flex items-center gap-2"><SimBadge /><span className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${s.outcome.status === "target_reached" ? "bg-up-soft text-up" : s.outcome.status === "invalidated" ? "bg-down-soft text-down" : s.outcome.status === "active" ? "bg-accent-soft text-accent" : "bg-line text-ink-2"}`}>{OUTCOME_LABEL[s.outcome.status]}</span></div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <PriceChart candles={ctx.candles} ind={ind} symbol={s.symbol}
          setup={{ direction: s.direction, entry: s.entryRef, stop: s.stop, targets: s.targets.map((t) => ({ label: t.label, price: t.price })), fromDate: s.generatedOn }}
          markers={[{ date: s.generatedOn, direction: s.direction, label: "" }]} />
        <aside className="space-y-7">
          <section>
            <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Risk and reward</h2>
            <RiskLadder s={s} />
            <dl className="divide-y divide-line text-[13.5px]">
              <div className="flex justify-between py-2"><dt className="text-ink-2">Risk to stop</dt><dd className="num font-medium">{riskPct.toFixed(2)}% of entry</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-2">Reward : risk to first target</dt><dd className="num font-medium">{s.riskReward != null ? `${s.riskReward.toFixed(1)} : 1` : "No target defined"}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-2">Review window</dt><dd className="num font-medium">{s.horizonBars} trading days{s.expiresOn ? ` · ${shortDate(s.expiresOn)}` : ""}</dd></div>
            </dl>
          </section>
          <section className="rounded-lg border border-warn/40 bg-warn-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
            This is a research output from an academic prototype on simulated data. It is not advice, and it does not predict returns.
          </section>
        </aside>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">In plain language</h2>
          <div className="space-y-3 pt-3 text-[14.5px] leading-[1.65] text-ink">{explainSignal(s).map((p, i) => <p key={i}>{p}</p>)}</div>
          <h3 className="mt-7 border-b border-line pb-2.5 text-[14px] font-semibold">Entry condition</h3>
          <p className="pt-3 text-[13.5px] leading-relaxed text-ink-2">{s.entryNote}</p>
        </section>

        <section className="space-y-7">
          <div>
            <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold text-up">Evidence for</h2>
            <ul className="divide-y divide-line">{s.supporting.map((e, i) => <li key={i} className="py-2.5 text-[13.5px]"><span className="font-medium">{e.label}.</span> <span className="text-ink-2">{e.detail}</span></li>)}</ul>
          </div>
          <div>
            <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold text-down">Reasons to avoid it</h2>
            {s.conflicting.length === 0 ? <p className="py-3 text-[13.5px] text-ink-2">The other rules did not argue against this setup on this bar. That does not make it safe: any stop can be gapped through.</p> : <ul className="divide-y divide-line">{s.conflicting.map((e, i) => <li key={i} className="py-2.5 text-[13.5px]"><span className="font-medium">{e.label}.</span> <span className="text-ink-2">{e.detail}</span></li>)}</ul>}
          </div>
        </section>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Market regime</h2>
          <p className="pt-3 text-[13.5px] leading-relaxed text-ink-2">On the signal bar the instrument was in a <b className="font-medium text-ink">{regimeLabel(reg.regime)}</b>{reg.highVol ? " with high volatility" : ""}. Daily range (ATR) was {reg.atrPct.toFixed(2)}% of price.</p>
        </section>
        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">Inputs at the signal bar</h2>
          <dl className="divide-y divide-line text-[13.5px]">
            {([["Close", price(s.indicators.close)], ["SMA 50 / 200", `${price(s.indicators.sma50)} / ${price(s.indicators.sma200)}`], ["RSI (14)", s.indicators.rsi14.toFixed(1)], ["MACD histogram", s.indicators.macdHist.toFixed(2)], ["ADX (14)", s.indicators.adx14.toFixed(1)], ["ATR (14)", price(s.indicators.atr14)], ["Relative volume", `${s.indicators.relVol.toFixed(2)}×`]] as [string, string][]).map(([k, v]) => <div key={k} className="flex justify-between py-1.5"><dt className="text-ink-2">{k}</dt><dd className="num font-medium">{v}</dd></div>)}
          </dl>
        </section>
        <section>
          <h2 className="border-b border-line pb-2.5 text-[14px] font-semibold">How this rule has behaved</h2>
          <p className="pt-3 text-[13.5px] leading-relaxed text-ink-2">{same.length < MIN_SAMPLE ? `Only ${same.length} resolved signals exist for this rule in the simulated sample. That is too few to judge it, so no hit rate is shown.` : `${wins} of ${same.length} resolved signals reached the first target before the stop on simulated data.`} This is in-sample and simulated; it is not independent evidence.</p>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] text-ink-2">{meta.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
