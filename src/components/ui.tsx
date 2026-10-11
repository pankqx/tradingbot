import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { STATUS_LABEL } from "@/lib/format";

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 16.5v-3M12 16.5V9M17 16.5v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="7.2" r="1.6" fill="var(--accent)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="display text-[19px] leading-none tracking-tight">
      trading<span className="relative">b<span className="inline-block rounded-full border-[2.5px] border-accent align-[-1px]" style={{ width: "0.52em", height: "0.64em" }} />t</span>
    </span>
  );
}

type Dir = "bullish" | "bearish" | "neutral" | "insufficient_data";

const DIR_STYLE: Record<Dir, string> = {
  bullish: "bg-up-soft text-up",
  bearish: "bg-down-soft text-down",
  neutral: "bg-line text-ink-2",
  insufficient_data: "bg-line text-ink-3",
};

export function DirectionPill({ status, conflicted }: { status: Dir; conflicted?: boolean }) {
  const Icon = status === "bullish" ? ArrowUpRight : status === "bearish" ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${DIR_STYLE[status]}`}>
      <Icon className="size-3" strokeWidth={2.25} aria-hidden />
      {conflicted ? "Mixed" : STATUS_LABEL[status]}
    </span>
  );
}

export function Delta({ value, className = "", digits = 2, arrow = false }: { value: number; className?: string; digits?: number; arrow?: boolean }) {
  const up = value >= 0;
  return (
    <span className={`num ${up ? "text-up" : "text-down"} ${className}`}>
      {arrow && (up ? "▲ " : "▼ ")}
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(digits)}%
    </span>
  );
}

/** Ten-step meter. Measures evidence alignment, never probability. */
export function ScoreMeter({ score, tone }: { score: number; tone: "bullish" | "bearish" | "neutral" }) {
  const filled = Math.round(score / 10);
  const color = tone === "bullish" ? "bg-up" : tone === "bearish" ? "bg-down" : "bg-ink-3";
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={`Research score ${Math.round(score)} out of 100`}>
      <span className="flex gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-3.5 w-[3px] rounded-[1px] ${i < filled ? color : "bg-line-strong/60"}`} />
        ))}
      </span>
      <span className="num w-6 text-right text-[13px] font-medium">{Math.round(score)}</span>
    </span>
  );
}

export function Sparkline({ values, width = 120, height = 36, animate = true, tone }: { values: number[]; width?: number; height?: number; animate?: boolean; tone?: "up" | "down" }) {
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const up = tone ? tone === "up" : values[values.length - 1] >= values[0];
  const color = up ? "var(--up)" : "var(--down)";
  const id = `sg-${Math.round(values[0] * 100)}-${values.length}-${Math.round(values[values.length - 1] * 100)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${id})`} className={animate ? "fade-in" : ""} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" pathLength={1} style={{ ["--len" as string]: 1 }} className={animate ? "spark-line" : ""} />
    </svg>
  );
}

export function SimBadge({ children = "Simulated" }: { children?: ReactNode }) {
  return <span className="rounded border border-warn/40 bg-warn-soft px-1.5 py-px text-[11px] font-medium text-warn">{children}</span>;
}

export function PanelTitle({ title, aside, sub }: { title: string; aside?: ReactNode; sub?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-2.5">
      <div>
        <h2 className="text-[14px] font-semibold tracking-[-0.005em]">{title}</h2>
        {sub && <p className="mt-0.5 text-[12.5px] text-ink-3">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 py-14 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="max-w-sm text-[13.5px] text-ink-2">{body}</p>
      {action}
    </div>
  );
}
