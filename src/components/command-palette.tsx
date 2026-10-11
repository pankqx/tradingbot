"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { DirectionPill } from "./ui";
import { EXTRA_PAGES, NAV } from "./nav";

export interface PaletteInstrument {
  symbol: string;
  name: string;
  sector: string;
  status: "bullish" | "bearish" | "neutral" | "insufficient_data";
}

type Entry = { key: string; label: string; hint: string; href: string; status?: PaletteInstrument["status"]; group: "Pages" | "Instruments" };

export function CommandPalette({ open, onClose, instruments }: { open: boolean; onClose: () => void; instruments: PaletteInstrument[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const needle = q.trim().toLowerCase();
    const pages: Entry[] = [...NAV, ...EXTRA_PAGES].map((n) => ({ key: n.href, label: n.label, hint: "Page", href: n.href, group: "Pages" }));
    const stocks: Entry[] = instruments.map((i) => ({ key: i.symbol, label: i.symbol, hint: `${i.name} · ${i.sector}`, href: `/stocks/${encodeURIComponent(i.symbol)}`, status: i.status, group: "Instruments" }));
    const match = (e: Entry) => !needle || e.label.toLowerCase().includes(needle) || e.hint.toLowerCase().includes(needle);
    return needle ? [...stocks.filter(match), ...pages.filter(match)] : [...stocks.slice(0, 6), ...pages.slice(0, 4)];
  }, [q, instruments]);

  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-i="${cursor}"]`)?.scrollIntoView({ block: "nearest" }); }, [cursor]);

  if (!open) return null;

  const go = (e: Entry | undefined) => { if (!e) return; onClose(); setQ(""); setCursor(0); router.push(e.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, entries.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(entries[cursor]); }
    else if (e.key === "Escape") onClose();
  };
  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-items-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[3px] fade-in" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Search instruments and pages" className="menu-pop w-full max-w-[560px] overflow-hidden rounded-xl border border-line-strong bg-raised shadow-[var(--shadow)]" onKeyDown={onKey}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-ink-3" strokeWidth={1.8} />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setCursor(0); }} placeholder="Search a stock, sector or page" aria-label="Search" className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3" />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-3">Esc</kbd>
        </div>
        <ul ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          {entries.length === 0 && <li className="px-3 py-8 text-center text-[13.5px] text-ink-2">No match for “{q}”. Try a ticker such as RELIANCE or a sector like Banking.</li>}
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? e.group : null;
            lastGroup = e.group;
            return (
              <li key={e.key} role="presentation">
                {header && <div className="px-3 pb-1 pt-2 text-[12px] font-medium text-ink-3">{header}</div>}
                <button data-i={i} role="option" aria-selected={i === cursor} onMouseMove={() => setCursor(i)} onClick={() => go(e)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left ${i === cursor ? "bg-accent-soft" : ""}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{e.label}</span>
                    <span className="block truncate text-[12.5px] text-ink-3">{e.hint}</span>
                  </span>
                  {e.status && <DirectionPill status={e.status} />}
                  {i === cursor && <CornerDownLeft className="size-3.5 text-ink-3" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[12px] text-ink-3">
          <span>↑↓ move</span><span>↵ open</span><span className="ml-auto">Press / or ⌘K anywhere</span>
        </div>
      </div>
    </div>
  );
}
