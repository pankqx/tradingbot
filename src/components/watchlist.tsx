"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Star } from "lucide-react";

const KEY = "tb0t.watchlist";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb); }; };
const read = () => { try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; } };

/** Device-local watchlist (browser storage). Accounts and sync come with authentication. */
export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const list = useMemo<string[]>(() => { try { return JSON.parse(raw); } catch { return []; } }, [raw]);
  const toggle = useCallback((symbol: string) => {
    const cur: string[] = (() => { try { return JSON.parse(read()); } catch { return []; } })();
    const next = cur.includes(symbol) ? cur.filter((s) => s !== symbol) : [...cur, symbol];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    listeners.forEach((l) => l());
  }, []);
  return { list, has: (s: string) => list.includes(s), toggle };
}

export function StarButton({ symbol, className = "" }: { symbol: string; className?: string }) {
  const { has, toggle } = useWatchlist();
  const on = has(symbol);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(symbol); }}
      aria-pressed={on}
      aria-label={on ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      title={on ? "Remove from watchlist" : "Add to watchlist"}
      className={`grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-line/60 hover:text-warn ${on ? "text-warn" : ""} ${className}`}
    >
      <Star className="size-[16px]" strokeWidth={1.7} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
