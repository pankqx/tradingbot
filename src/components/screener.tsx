"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Bookmark, X } from "lucide-react";
import { DirectionPill, EmptyState, ScoreMeter } from "./ui";
import { StarButton, useWatchlist } from "./watchlist";
import { crore, price, signedPct } from "@/lib/format";

export interface ScreenerRow {
  symbol: string; name: string; sector: string; status: "bullish" | "bearish" | "neutral" | "insufficient_data"; conflicted: boolean;
  strategy: string | null; score: number | null; lean: "bullish" | "bearish" | null; last: number; changePct: number;
  rsi: number | null; adx: number | null; relVol: number | null; atrPct: number | null; aboveSma200: boolean | null; ret1m: number | null; turnover: number;
}

interface Filters {
  q: string; sector: string; direction: string; trend: string; minScore: number; rsiMin: string; rsiMax: string; minAdx: string; minRelVol: string; minPrice: string; maxPrice: string; maxAtr: string; watchOnly: boolean;
}
const EMPTY: Filters = { q: "", sector: "all", direction: "all", trend: "any", minScore: 0, rsiMin: "", rsiMax: "", minAdx: "", minRelVol: "", minPrice: "", maxPrice: "", maxAtr: "", watchOnly: false };

const BUILT_IN: { name: string; f: Partial<Filters> }[] = [
  { name: "Volume breakouts", f: { direction: "bullish", minRelVol: "1.5" } },
  { name: "Pullbacks in uptrends", f: { trend: "above", rsiMax: "45" } },
  { name: "Strong trends", f: { minAdx: "25" } },
  { name: "Calmer stocks", f: { maxAtr: "2" } },
];

const KEY = "tb0t.savedFilters";
const subs = new Set<() => void>();
const sub = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb); }; };
const readSaved = () => { try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; } };

type SortKey = "symbol" | "score" | "last" | "changePct" | "rsi" | "adx" | "relVol" | "ret1m";
const num = (s: string) => (s.trim() === "" ? null : Number(s));

export function Screener({ rows }: { rows: ScreenerRow[] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "score", dir: -1 });
  const [page, setPage] = useState(0);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const { list } = useWatchlist();
  const savedRaw = useSyncExternalStore(sub, readSaved, () => "[]");
  const saved = useMemo<{ name: string; f: Filters }[]>(() => { try { return JSON.parse(savedRaw); } catch { return []; } }, [savedRaw]);
  const sectors = useMemo(() => [...new Set(rows.map((r) => r.sector))].sort(), [rows]);
  const PAGE = 10;

  const set = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => { setF((p) => ({ ...p, [k]: v })); setPage(0); }, []);
  const persist = (next: { name: string; f: Filters }[]) => { try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ } subs.forEach((s) => s()); };

  const out = useMemo(() => {
    const a = num(f.rsiMin), b = num(f.rsiMax), adx = num(f.minAdx), rv = num(f.minRelVol), pmin = num(f.minPrice), pmax = num(f.maxPrice), atr = num(f.maxAtr);
    const q = f.q.trim().toLowerCase();
    const r = rows.filter((x) =>
      (!q || x.symbol.toLowerCase().includes(q) || x.name.toLowerCase().includes(q)) &&
      (f.sector === "all" || x.sector === f.sector) &&
      (f.direction === "all" || (f.direction === "mixed" ? x.status === "neutral" : x.status === f.direction)) &&
      (f.trend === "any" || (f.trend === "above" ? x.aboveSma200 === true : x.aboveSma200 === false)) &&
      (x.score ?? 0) >= f.minScore &&
      (a == null || (x.rsi != null && x.rsi >= a)) && (b == null || (x.rsi != null && x.rsi <= b)) &&
      (adx == null || (x.adx != null && x.adx >= adx)) && (rv == null || (x.relVol != null && x.relVol >= rv)) &&
      (pmin == null || x.last >= pmin) && (pmax == null || x.last <= pmax) && (atr == null || (x.atrPct != null && x.atrPct <= atr)) &&
      (!f.watchOnly || list.includes(x.symbol)));
    const k = sort.key;
    return [...r].sort((p, q2) => {
      const av = k === "symbol" ? p.symbol : (p[k] ?? -Infinity), bv = k === "symbol" ? q2.symbol : (q2[k] ?? -Infinity);
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [rows, f, sort, list]);

  const pages = Math.max(1, Math.ceil(out.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = out.slice(cur * PAGE, cur * PAGE + PAGE);
  const th = (key: SortKey, label: string, right = false) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`py-2 pr-3 font-normal ${right ? "text-right" : "text-left"}`}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))} className={`inline-flex items-center gap-1 hover:text-ink ${sort.key === key ? "text-ink" : ""}`}>{label}{sort.key === key && <span aria-hidden>{sort.dir === -1 ? "↓" : "↑"}</span>}</button>
    </th>
  );
  const field = "h-8 w-full rounded-md border border-line bg-raised px-2 text-[13px]";
  const lab = "block text-[12.5px] text-ink-3 mb-1";

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="flex flex-wrap gap-1.5">
          {BUILT_IN.map((p) => <button key={p.name} onClick={() => { setF({ ...EMPTY, ...p.f }); setPage(0); }} className="rounded-full border border-line px-2.5 py-1 text-[12.5px] text-ink-2 hover:border-line-strong">{p.name}</button>)}
          {saved.map((p, i) => (
            <span key={p.name + i} className="inline-flex items-center rounded-full border border-accent/40 bg-accent-soft text-[12.5px] text-accent">
              <button onClick={() => { setF({ ...EMPTY, ...p.f }); setPage(0); }} className="py-1 pl-2.5 pr-1.5">{p.name}</button>
              <button aria-label={`Delete saved filter ${p.name}`} onClick={() => persist(saved.filter((_, j) => j !== i))} className="py-1 pr-2"><X className="size-3" /></button>
            </span>
          ))}
        </div>
        <div><label className={lab} htmlFor="q">Search</label><input id="q" className={field} placeholder="Ticker or company" value={f.q} onChange={(e) => set("q", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lab} htmlFor="sec">Sector</label><select id="sec" className={field} value={f.sector} onChange={(e) => set("sector", e.target.value)}><option value="all">All</option>{sectors.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className={lab} htmlFor="dir">Setup</label><select id="dir" className={field} value={f.direction} onChange={(e) => set("direction", e.target.value)}><option value="all">Any</option><option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="mixed">None / mixed</option></select></div>
        </div>
        <div><label className={lab} htmlFor="tr">Long-term trend</label><select id="tr" className={field} value={f.trend} onChange={(e) => set("trend", e.target.value)}><option value="any">Any</option><option value="above">Price above 200-day average</option><option value="below">Price below 200-day average</option></select></div>
        <div><label className={lab} htmlFor="ms">Minimum research score: <span className="num text-ink">{f.minScore}</span></label><input id="ms" type="range" min={0} max={90} step={5} value={f.minScore} onChange={(e) => set("minScore", Number(e.target.value))} className="w-full accent-[var(--accent)]" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lab} htmlFor="r1">RSI from</label><input id="r1" inputMode="decimal" className={field} placeholder="0" value={f.rsiMin} onChange={(e) => set("rsiMin", e.target.value)} /></div>
          <div><label className={lab} htmlFor="r2">RSI to</label><input id="r2" inputMode="decimal" className={field} placeholder="100" value={f.rsiMax} onChange={(e) => set("rsiMax", e.target.value)} /></div>
          <div><label className={lab} htmlFor="adx">ADX at least</label><input id="adx" inputMode="decimal" className={field} placeholder="25" value={f.minAdx} onChange={(e) => set("minAdx", e.target.value)} /></div>
          <div><label className={lab} htmlFor="rv">Rel. volume ≥</label><input id="rv" inputMode="decimal" className={field} placeholder="1.5" value={f.minRelVol} onChange={(e) => set("minRelVol", e.target.value)} /></div>
          <div><label className={lab} htmlFor="p1">Price from</label><input id="p1" inputMode="decimal" className={field} value={f.minPrice} onChange={(e) => set("minPrice", e.target.value)} /></div>
          <div><label className={lab} htmlFor="p2">Price to</label><input id="p2" inputMode="decimal" className={field} value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} /></div>
        </div>
        <div><label className={lab} htmlFor="atr">Daily range (ATR %) at most</label><input id="atr" inputMode="decimal" className={field} placeholder="3" value={f.maxAtr} onChange={(e) => set("maxAtr", e.target.value)} /></div>
        <label className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" checked={f.watchOnly} onChange={(e) => set("watchOnly", e.target.checked)} className="size-4 accent-[var(--accent)]" /> Only my watchlist</label>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          {naming ? (
            <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); const n = name.trim(); if (n) { persist([...saved.filter((s) => s.name !== n), { name: n, f }]); } setNaming(false); setName(""); }}>
              <input autoFocus aria-label="Filter name" className={field} placeholder="Name this filter" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="rounded-md bg-ink px-3 text-[13px] text-paper">Save</button>
            </form>
          ) : (
            <>
              <button onClick={() => setNaming(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-2 hover:border-line-strong"><Bookmark className="size-3.5" /> Save filter</button>
              <button onClick={() => { setF(EMPTY); setPage(0); }} className="px-2 text-[13px] text-ink-3 hover:text-ink">Reset</button>
            </>
          )}
        </div>
      </aside>

      <section aria-label="Results" className="min-w-0">
        <p className="border-b border-line pb-2.5 text-[13.5px] text-ink-2"><span className="num font-medium text-ink">{out.length}</span> of {rows.length} instruments match</p>
        {slice.length === 0 ? <EmptyState title="No instruments match" body="These filters are too tight for this universe. Reset them or widen one range." action={<button onClick={() => { setF(EMPTY); setPage(0); }} className="mt-1 rounded-full bg-ink px-4 py-1.5 text-[13.5px] text-paper">Reset filters</button>} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13.5px]">
              <thead className="text-[12px] text-ink-3"><tr className="border-b border-line">{th("symbol", "Instrument")}<th className="py-2 pr-3 text-left font-normal">Setup</th>{th("score", "Score")}{th("last", "Last", true)}{th("changePct", "Day", true)}{th("rsi", "RSI", true)}{th("adx", "ADX", true)}{th("relVol", "Rel. vol", true)}{th("ret1m", "1M", true)}<th className="w-9" /></tr></thead>
              <tbody className="divide-y divide-line">
                {slice.map((r) => (
                  <tr key={r.symbol} className="row-hover">
                    <td className="py-2.5 pr-3"><Link href={`/stocks/${encodeURIComponent(r.symbol)}`} className="block"><span className="font-semibold">{r.symbol}</span><span className="block text-[12.5px] text-ink-3">{r.name} · {crore(r.turnover)}/day</span></Link></td>
                    <td className="pr-3"><DirectionPill status={r.status} conflicted={r.conflicted} /></td>
                    <td className="pr-3">{r.score != null ? <ScoreMeter score={r.score} tone={r.status === "neutral" ? "neutral" : (r.lean ?? "neutral")} /> : "—"}</td>
                    <td className="num pr-3 text-right font-medium">{price(r.last)}</td>
                    <td className={`num pr-3 text-right ${r.changePct >= 0 ? "text-up" : "text-down"}`}>{signedPct(r.changePct)}</td>
                    <td className="num pr-3 text-right text-ink-2">{r.rsi?.toFixed(0) ?? "—"}</td>
                    <td className="num pr-3 text-right text-ink-2">{r.adx?.toFixed(0) ?? "—"}</td>
                    <td className="num pr-3 text-right text-ink-2">{r.relVol ? `${r.relVol.toFixed(1)}×` : "—"}</td>
                    <td className={`num pr-3 text-right ${(r.ret1m ?? 0) >= 0 ? "text-up" : "text-down"}`}>{r.ret1m != null ? signedPct(r.ret1m, 1) : "—"}</td>
                    <td><StarButton symbol={r.symbol} /></td>
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
    </div>
  );
}
