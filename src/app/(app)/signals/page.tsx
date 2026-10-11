import { SignalLedger, type LedgerRow } from "@/components/signal-ledger";
import { SimBadge } from "@/components/ui";
import { STRATEGIES } from "@/lib/analytics/signals";
import { allHistory } from "@/lib/data/universe";

export const metadata = { title: "Signals" };

export default function SignalsPage() {
  const hist = allHistory();
  const rows: LedgerRow[] = hist.map((h) => ({
    id: h.id, symbol: h.symbol, date: h.generatedOn, direction: h.direction, strategy: h.strategy.name, strategyId: h.strategy.id,
    entry: h.entryRef, stop: h.stop, t1: h.targets[0]?.price ?? null, status: h.outcome.status, move: h.outcome.directionalMovePct, resolvedOn: h.outcome.resolvedOn, bars: h.outcome.barsEvaluated,
  }));
  const resolved = hist.filter((h) => h.outcome.status !== "active");
  const target = resolved.filter((h) => h.outcome.status === "target_reached").length;
  const stopped = resolved.filter((h) => h.outcome.status === "invalidated").length;
  const expired = resolved.filter((h) => h.outcome.status === "expired").length;
  const correctDir = resolved.filter((h) => h.outcome.directionalMovePct > 0).length;
  const pct = (n: number) => (resolved.length ? `${Math.round((n / resolved.length) * 100)}%` : "—");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-[30px] leading-tight md:text-[36px]">Signals</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-2">Every setup the engine has generated, in the order it was generated. Records are written before outcomes are measured, and losing signals are never removed.</p>
        </div>
        <SimBadge>Simulated data</SimBadge>
      </div>

      <section aria-label="Resolved signal summary" className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Resolved signals", String(resolved.length), `${hist.length - resolved.length} still active`],
          ["Reached first target", pct(target), `${target} signals`],
          ["Hit the stop first", pct(stopped), `${stopped} signals`],
          ["Expired unresolved", pct(expired), `${expired} signals`],
          ["Closed in signal direction", pct(correctDir), "directional move > 0"],
        ].map(([k, v, sub]) => (
          <div key={k} className="bg-surface px-4 py-3.5"><p className="text-[12.5px] text-ink-3">{k}</p><p className="display num mt-1 text-[26px] leading-none">{v}</p><p className="mt-1 text-[12.5px] text-ink-3">{sub}</p></div>
        ))}
      </section>
      <p className="-mt-4 max-w-3xl text-[12.5px] leading-relaxed text-ink-3">These counts describe how the rules behaved on a simulated random-walk sample. They are not evidence of how the rules would perform on real markets, and directional accuracy is shown separately from profitability because a signal can be right on direction and still lose money after costs.</p>

      <SignalLedger rows={rows} strategies={Object.values(STRATEGIES).map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
