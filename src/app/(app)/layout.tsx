import { Header, type Notice } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { allHistory, getUniverse } from "@/lib/data/universe";
import { shortDate } from "@/lib/format";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const u = getUniverse();
  const instruments = u.snapshots.map((s) => ({ symbol: s.instrument.symbol, name: s.instrument.name, sector: s.instrument.sector, status: s.status }));
  const lastDate = u.asOf.slice(0, 10);
  const lastIdx = u.contexts.get(u.snapshots[0].instrument.symbol)!.candles.length - 1;
  const recent = allHistory().filter((h) => lastIdx - h.barIndex <= 5).slice(0, 8);
  const notices: Notice[] = recent.map((h) => ({
    id: h.id,
    text: `${h.symbol}: ${h.direction} setup · ${h.strategy.name}`,
    sub: h.outcome.status === "invalidated" ? `Invalidated ${shortDate(h.outcome.resolvedOn!)}` : `Generated ${shortDate(h.generatedOn)} · simulated`,
    href: `/signals/${encodeURIComponent(h.id)}`,
    tone: h.outcome.status === "invalidated" ? "warn" : h.direction === "bullish" ? "up" : "down",
  }));
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header instruments={instruments} notices={notices} asOfLabel={`close ${shortDate(lastDate)}`} />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-24 pt-6 md:pb-12 lg:px-8">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-[12.5px] text-ink-3 lg:px-8">
          Research output from an academic prototype. Not investment advice, and not a recommendation to buy or sell. All prices on this site are simulated.
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}
