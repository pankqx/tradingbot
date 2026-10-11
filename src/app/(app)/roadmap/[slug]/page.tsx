import Link from "next/link";
import { notFound } from "next/navigation";

const ITEMS: Record<string, { title: string; milestone: string; body: string; includes: string[] }> = {
  charts: { title: "Charts", milestone: "Milestone 4", body: "A full-screen charting terminal. Candlesticks and indicators already work on every stock page; this adds multi-pane layouts and watchlist navigation.", includes: ["Side-by-side symbols", "Drawing tools", "Timeframes beyond daily once an intraday source is licensed"] },
  watchlists: { title: "Watchlists", milestone: "Milestone 2", body: "Named lists with notes and alerts. For now, the star on any instrument saves it to a list in this browser.", includes: ["Multiple named lists", "Sync across devices after sign-in", "Change tracking since you last looked"] },
  "paper-trading": { title: "Paper trading", milestone: "Milestone 5", body: "Practise with simulated money. Orders, fees, slippage and P&L will use deterministic accounting that is tested.", includes: ["Open and close simulated positions", "Link trades to signals", "Fees and slippage"] },
  backtesting: { title: "Backtesting", milestone: "Milestone 4", body: "Run a rule over history with costs, then check it on data it was not tuned on.", includes: ["Equity curve and drawdown", "Trade log", "Out-of-sample split", "Benchmark comparison"] },
  learn: { title: "Learn", milestone: "Milestone 5", body: "Short lessons in plain English, with quizzes and chart exercises, from how shares work to model validation.", includes: ["Beginner to advanced paths", "Quizzes", "Progress tracking"] },
  journal: { title: "Journal", milestone: "Milestone 5", body: "Write why you took a simulated trade and review what you would change.", includes: ["Rationale per trade", "Mistake tags", "Review prompts"] },
  settings: { title: "Settings", milestone: "Milestone 2", body: "Your research profile: experience, objectives, risk limits and preferred sectors, collected in a short onboarding.", includes: ["Onboarding", "Editable profile", "Screener defaults from your answers"] },
};

export function generateStaticParams() { return Object.keys(ITEMS).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<"/roadmap/[slug]">) {
  const { slug } = await params;
  return { title: ITEMS[slug]?.title ?? "Roadmap" };
}

export default async function RoadmapPage({ params }: PageProps<"/roadmap/[slug]">) {
  const { slug } = await params;
  const it = ITEMS[slug];
  if (!it) notFound();
  return (
    <div className="max-w-xl space-y-5 py-8">
      <p className="text-[13px] text-ink-3">Not built yet · planned for {it.milestone}</p>
      <h1 className="display text-[34px] leading-tight">{it.title}</h1>
      <p className="text-[15px] leading-relaxed text-ink-2">{it.body}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-[14.5px]">{it.includes.map((x) => <li key={x}>{x}</li>)}</ul>
      <Link href="/" className="inline-block rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper">Back to overview</Link>
    </div>
  );
}
