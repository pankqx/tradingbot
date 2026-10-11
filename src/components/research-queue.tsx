"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DirectionPill, EmptyState, ScoreMeter, Sparkline } from "./ui";
import { StarButton, useWatchlist } from "./watchlist";
import { price, signedPct } from "@/lib/format";

export interface QueueRow {
  symbol: string; name: string; sector: string;
  status: "bullish" | "bearish" | "neutral" | "insufficient_data";
  conflicted: boolean; strategy: string | null; score: number | null; lean: "bullish" | "bearish" | null;
  last: number; changePct: number; riskPct: number | null; ret1m: number | null; spark: number[];
}

type Tab = "all" | "bullish" | "bearish" | "mixed" | "watchlist";
type Sort = "score" | "change" | "ret1m" | "risk";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" }, { id: "bullish", label: "Bullish" }, { id: "bearish", label: "Bearish" },
  { id: "mixed", label: "Neutral or mixed" }, { id: "watchlist", label: "Watchlist" },
];

export function ResearchQueue({ rows, title = "Research queue", compact = false }: { rows: QueueRow[]; title?: string; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("all");
  const [sector, setSector] = useState("all");
  const [sort, setSort] = useState<Sort>("score");
  const { list } = useWatchlist();
  const sectors = useMemo(() => [...new Set(rows.map((r) => r.sector))].sort(), [rows]);

  const shown = useMemo(() => {
    const f = rows.filter((r) =>
      (sector === "all" || r.sector === sector) &&
      (tab === "all" || (tab === "watchlist" ? list.includes(r.symbol) : tab === "mixed" ? r.status === "neutral" || r.status === "insufficient_data" : r.status === tab)));
    const key = (r: QueueRow) => (sort === "score" ? r.score ?? -1 : sort === "change" ? r.changePct : sort === "ret1m" ? r.ret1m ?? -999 : r.riskPct != null ? -r.riskPct : -999);
    return [...f].sort((a, b) => key(b) - key(a));
  }, [rows, tab, sector, sort, list]);

  const counts = useMemo(() => ({ bullish: rows.filter((r) => r.status === "bullish").length, bearish: rows.filter((r) => r.status === "bearish").length }), [rows]);

  return (
    <section aria-labelledby="queue-h" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-3">
        <div>
          <h2 id="queue-h" className="text-[15px] font-semibold">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{counts.bullish} bullish and {counts.bearish} bearish setups across {rows.length} instruments. Score measures how well the evidence lines up. It is not a chance of profit.</p>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <label className="sr-only" htmlFor="sector">Sector</label>
          <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className="h-8 rounded-md border border-line bg-raised px-2 text-ink-2">
            <option value="all">All sectors</option>
            {sectors.map((s) => <option key={s}>{s}</option>)}
          </select>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-8 rounded-md border border-line bg-raised px-2 text-ink-2">
            <option value="score">Sort: research score</option>
            <option value="change">Sort: day change</option>
            <option value="ret1m">Sort: 1-month return</option>
            <option value="risk">Sort: smallest risk to stop</option>
          </select>
        </div>
      </div>
      <div role="tablist" aria-label="Setup filter" className="flex gap-1 overflow-x-auto border-b border-line py-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-3 py-1 text-[13px] transition-colors ${tab === t.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-line/60"}`}>
            {t.label}{t.id === "watchlist" && list.length > 0 ? ` (${list.length})` : ""}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title={tab === "watchlist" ? "Your watchlist is empty" : "Nothing matches these filters"} body={tab === "watchlist" ? "Tap the star beside any instrument to follow it. Your list is saved in this browser." : "Try a different sector or switch back to All."} />
      ) : (
        <>
      <div className="hidden grid-cols-[minmax(130px,1fr)_minmax(150px,1.2fr)_124px_96px_64px_84px] gap-x-3 pl-1 pr-12 py-2 text-[12px] text-ink-3 md:grid" aria-hidden>
        <span>Instrument</span><span>Setup</span><span>Research score</span><span>Last · day</span><span>Risk to stop</span><span>3-month trend</span>
      </div>
        <ul className="divide-y divide-line">
          {shown.map((r, i) => (
            <li key={r.symbol} className="row-hover relative" style={compact ? undefined : { animation: `fade-in 260ms ease-out ${Math.min(i, 12) * 22}ms both` }}>
              <Link href={`/stocks/${encodeURIComponent(r.symbol)}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-3 pl-1 pr-12 md:grid-cols-[minmax(130px,1fr)_minmax(150px,1.2fr)_124px_96px_64px_84px] md:pr-12">
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold">{r.symbol}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">{r.name} · {r.sector}</span>
                </span>
                <span className="order-3 col-span-2 flex flex-wrap items-center gap-2 md:order-none md:col-span-1">
                  <DirectionPill status={r.status} conflicted={r.conflicted} />
                  <span className="truncate text-[12.5px] text-ink-2">{r.strategy ?? (r.conflicted ? "Strategies disagree" : "No trigger today")}</span>
                </span>
                <span className="hidden md:block">{r.score != null ? <ScoreMeter score={r.score} tone={r.status === "neutral" || r.status === "insufficient_data" ? "neutral" : (r.lean ?? "neutral")} /> : <span className="text-ink-3">—</span>}</span>
                <span className="num text-right md:text-left">
                  <span className="block text-[14px] font-medium">{price(r.last)}</span>
                  <span className={`block text-[12.5px] ${r.changePct >= 0 ? "text-up" : "text-down"}`}>{signedPct(r.changePct)}</span>
                </span>
                <span className="num hidden text-[13px] text-ink-2 md:block">{r.riskPct != null ? `${r.riskPct.toFixed(1)}%` : "—"}</span>
                <span className="hidden md:block"><Sparkline values={r.spark} width={84} height={26} animate={false} /></span>
              </Link>
              <StarButton symbol={r.symbol} className="absolute right-1 top-1/2 -translate-y-1/2" />
            </li>
          ))}
        </ul>
        </>
      )}
    </section>
  );
}
