"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "./ui";
import { OUTCOME_LABEL, price, shortDate } from "@/lib/format";

export interface LedgerRow {
  id: string; symbol: string; date: string; direction: "bullish" | "bearish"; strategy: string; strategyId: string;
  entry: number; stop: number; t1: number | null; status: keyof typeof OUTCOME_LABEL; move: number; resolvedOn: string | null; bars: number;
}

const STATUS_STYLE: Record<LedgerRow["status"], string> = {
  active: "bg-accent-soft text-accent", target_reached: "bg-up-soft text-up", invalidated: "bg-down-soft text-down", expired: "bg-line text-ink-2",
};

export function SignalLedger({ rows, strategies }: { rows: LedgerRow[]; strategies: { id: string; name: string }[] }) {
  const [dir, setDir] = useState("all");
  const [status, setStatus] = useState("all");
  const [strat, setStrat] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE = 15;
  const shown = useMemo(() => rows.filter((r) => (dir === "all" || r.direction === dir) && (status === "all" || r.status === status) && (strat === "all" || r.strategyId === strat)), [rows, dir, status, strat]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = shown.slice(cur * PAGE, cur * PAGE + PAGE);
  const sel = "h-8 rounded-md border border-line bg-raised px-2 text-[13px] text-ink-2";
  const reset = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { fn(e.target.value); setPage(0); };

  return (
    <section aria-labelledby="ledger-h">
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <h2 id="ledger-h" className="mr-auto text-[15px] font-semibold">Signal ledger <span className="font-normal text-ink-3">· {shown.length} records</span></h2>
        <select aria-label="Direction" className={sel} value={dir} onChange={reset(setDir)}><option value="all">All directions</option><option value="bullish">Bullish</option><option value="bearish">Bearish</option></select>
        <select aria-label="Outcome" className={sel} value={status} onChange={reset(setStatus)}><option value="all">All outcomes</option>{Object.entries(OUTCOME_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Strategy" className={sel} value={strat} onChange={reset(setStrat)}><option value="all">All strategies</option>{strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      {slice.length === 0 ? <EmptyState title="No signals match" body="Loosen a filter to see more of the ledger." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13.5px]">
            <thead className="text-left text-[12px] text-ink-3">
              <tr className="border-b border-line">
                {["Generated", "Instrument", "Direction", "Strategy", "Entry ref", "Stop", "Target 1", "Outcome", "Move in direction"].map((h, i) => <th key={h} className={`py-2 font-normal ${i >= 4 && i !== 7 ? "text-right" : ""} ${i === 8 ? "pr-1" : "pr-3"}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {slice.map((r) => (
                <tr key={r.id} className="row-hover">
                  <td className="py-2.5 pr-3"><Link href={`/signals/${encodeURIComponent(r.id)}`} className="text-ink-2 hover:underline">{shortDate(r.date)}</Link></td>
                  <td className="pr-3 font-medium"><Link href={`/stocks/${encodeURIComponent(r.symbol)}`} className="hover:underline">{r.symbol}</Link></td>
                  <td className={`pr-3 ${r.direction === "bullish" ? "text-up" : "text-down"}`}>{r.direction === "bullish" ? "Bullish" : "Bearish"}</td>
                  <td className="pr-3 text-ink-2">{r.strategy}</td>
                  <td className="num pr-3 text-right">{price(r.entry)}</td>
                  <td className="num pr-3 text-right text-ink-2">{price(r.stop)}</td>
                  <td className="num pr-3 text-right text-ink-2">{r.t1 != null ? price(r.t1) : "—"}</td>
                  <td className="pr-3"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${STATUS_STYLE[r.status]}`}>{OUTCOME_LABEL[r.status]}</span></td>
                  <td className={`num pr-1 text-right ${r.move >= 0 ? "text-up" : "text-down"}`}>{r.move >= 0 ? "+" : "−"}{Math.abs(r.move).toFixed(2)}%{r.status === "active" ? <span className="text-ink-3"> · {r.bars}d in</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-3 text-[13px] text-ink-2">
          <span>Page {cur + 1} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded-full border border-line px-3 py-1 disabled:opacity-40">Previous</button>
            <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded-full border border-line px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
