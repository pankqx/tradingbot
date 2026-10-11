import { SimBadge } from "@/components/ui";
import { SCORE_WEIGHTS } from "@/lib/analytics/scoring";
import { STRATEGIES } from "@/lib/analytics/signals";
import { DEMO_BARS, DEMO_LAST_BAR } from "@/lib/data/demo-provider";

export const metadata = { title: "Methodology" };

const TOC = [["data", "Data"], ["strategies", "Signal rules"], ["regime", "Market regime"], ["risk", "Stops and targets"], ["score", "Research score"], ["outcomes", "Measuring outcomes"], ["limits", "Limits"]];

const h2 = "scroll-mt-24 border-b border-line pb-2.5 text-[18px] font-semibold";
const p = "text-[14.5px] leading-[1.7] text-ink";

export default function MethodologyPage() {
  return (
    <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,720px)]">
      <nav aria-label="On this page" className="hidden text-[13.5px] lg:block"><ul className="sticky top-20 space-y-2 border-l border-line pl-4">{TOC.map(([id, l]) => <li key={id}><a href={`#${id}`} className="text-ink-2 hover:text-ink">{l}</a></li>)}</ul></nav>
      <article className="space-y-10">
        <header>
          <h1 className="display text-[32px] leading-tight md:text-[40px]">How signals are made</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">tradingb0t turns daily price and volume into explainable hypotheses. Nothing here is a prediction, and every rule below is published so you can test it yourself.</p>
        </header>

        <section className="space-y-3"><h2 id="data" className={h2}>Data <SimBadge /></h2>
          <p className={p}>All prices in this prototype come from a deterministic simulator, not from an exchange. It generates {DEMO_BARS} business-day candles per instrument ending {DEMO_LAST_BAR} using a seeded random walk with a different trend and volatility scenario for each symbol. Ticker names are real so the screens feel familiar; the prices are not.</p>
          <p className={p}>The same input always produces the same candles, so a demo can be repeated exactly. The application never swaps in simulated numbers when a live feed fails. A live provider will sit behind the same interface and will be shown with its own name, timestamp and licence terms. Exchange holidays and corporate actions are not modelled.</p>
        </section>

        <section className="space-y-4"><h2 id="strategies" className={h2}>Signal rules</h2>
          <p className={p}>Four deterministic rules read indicators at the latest close. Each returns a direction, a strength between 0 and 1, and the evidence behind it. When two rules strongly disagree the engine reports a neutral, mixed state instead of picking a side. With fewer than 210 bars it reports insufficient data.</p>
          {Object.values(STRATEGIES).map((s) => (
            <div key={s.id} className="border-l-2 border-accent pl-4">
              <h3 className="text-[15px] font-semibold">{s.name} <span className="text-[13px] font-normal text-ink-3">v{s.version} · reviewed over {s.horizonBars} trading days</span></h3>
              <p className="mt-1 text-[14px] text-ink-2">{s.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">{s.rules.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          ))}
        </section>

        <section className="space-y-3"><h2 id="regime" className={h2}>Market regime</h2>
          <p className={p}>Each instrument is labelled using ADX(14), the 50- and 200-day averages and ATR. An uptrend needs ADX of at least 25 with price above SMA50 above SMA200; a downtrend is the mirror image. ADX under 20 is range-bound. Anything else is transitional. ATR above 3.5% of price flags high volatility. The regime is used as context and as one factor in the score; it never creates a signal by itself.</p>
        </section>

        <section className="space-y-3"><h2 id="risk" className={h2}>Stops and targets</h2>
          <p className={p}>The invalidation level is 2× ATR(14) from the closing price for trend, momentum and breakout rules, and 1.5× ATR for mean reversion. That distance is defined as 1R. Targets are fixed multiples of it (1.5R and 3R), except mean reversion, whose only target is the 20-day mean and only when it offers at least 1R. These are planning distances, not forecasts, and real stops can be gapped through.</p>
        </section>

        <section className="space-y-3"><h2 id="score" className={h2}>Research score</h2>
          <p className={p}>The 0–100 score is a weighted average of six factors, each normalised to 0–1 before weighting. It describes how well the evidence lines up with the instrument’s lean. A score of 80 is not an 80% chance of profit; no probability model has been built or validated. If a factor is missing, it is dropped and the remaining weights are rescaled.</p>
          <dl className="divide-y divide-line border-y border-line text-[14px]">
            {Object.entries(SCORE_WEIGHTS).map(([k, w]) => <div key={k} className="flex justify-between py-2"><dt className="capitalize">{k}</dt><dd className="num">{Math.round(w * 100)}%</dd></div>)}
          </dl>
        </section>

        <section className="space-y-3"><h2 id="outcomes" className={h2}>Measuring outcomes</h2>
          <p className={p}>Replaying the engine bar by bar uses only data available on each bar, which a test confirms by truncating future candles. A signal is recorded first and judged afterwards: it is invalidated if a later bar trades through the stop, reaches its target if a bar trades through target 1, and expires when its review window ends. If one bar touches both, the stop is assumed to hit first. Directional accuracy (did price close in the signal’s direction) is shown separately from whether the trade would have made money.</p>
        </section>

        <section className="space-y-3"><h2 id="limits" className={h2}>Limits</h2>
          <ul className="list-disc space-y-2 pl-5 text-[14.5px] leading-[1.65]">
            <li>Results on simulated data say nothing about real markets.</li>
            <li>Backtests, paper trading, transaction costs and out-of-sample validation are not built yet. Until they are, no profitability claim is made.</li>
            <li>This is academic research output. It is not investment advice or a regulated service, and a disclaimer does not replace a legal review before any public launch.</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
