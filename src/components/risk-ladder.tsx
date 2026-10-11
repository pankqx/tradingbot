import { price } from "@/lib/format";
import type { SignalRecord } from "@/lib/analytics/types";

/** Vertical price ladder: stop, entry reference and targets drawn to scale. */
export function RiskLadder({ s }: { s: SignalRecord }) {
  const levels = [
    ...s.targets.map((t) => ({ label: t.label, price: t.price, kind: "target" as const, r: t.r })),
    { label: "Entry reference", price: s.entryRef, kind: "entry" as const, r: 0 },
    { label: "Stop (invalidation)", price: s.stop, kind: "stop" as const, r: -1 },
  ];
  const hi = Math.max(...levels.map((l) => l.price)), lo = Math.min(...levels.map((l) => l.price));
  const H = 280, pad = 22, span = hi - lo || 1;
  const y = (p: number) => pad + ((hi - p) / span) * (H - pad * 2);
  const color = (k: string) => (k === "target" ? "var(--up)" : k === "stop" ? "var(--down)" : "var(--warn)");
  const yE = y(s.entryRef), yS = y(s.stop), yT = y(s.targets[s.targets.length - 1]?.price ?? s.entryRef);
  return (
    <svg viewBox={`0 0 340 ${H}`} className="w-full" role="img" aria-label={`Risk ladder: stop ${price(s.stop)}, entry ${price(s.entryRef)}${s.targets.map((t) => `, ${t.label} ${price(t.price)}`).join("")}`}>
      <rect x="86" y={Math.min(yE, yS)} width="26" height={Math.abs(yS - yE)} fill="var(--down)" opacity="0.18" rx="3" />
      {s.targets.length > 0 && <rect x="86" y={Math.min(yE, yT)} width="26" height={Math.abs(yT - yE)} fill="var(--up)" opacity="0.16" rx="3" />}
      <line x1="99" x2="99" y1={Math.min(...levels.map((l) => y(l.price)))} y2={Math.max(...levels.map((l) => y(l.price)))} stroke="var(--line-strong)" strokeWidth="1.5" />
      {levels.map((l) => (
        <g key={l.label}>
          <circle cx="99" cy={y(l.price)} r="5" fill="var(--paper)" stroke={color(l.kind)} strokeWidth="2" />
          <text x="124" y={y(l.price) - 3} fontSize="12.5" fill="var(--ink)" fontWeight="500">{l.label}</text>
          <text x="124" y={y(l.price) + 12} fontSize="12" fill="var(--ink-3)" className="num">{price(l.price)}{l.kind === "target" ? `  ·  +${l.r}R` : l.kind === "stop" ? "  ·  −1R" : ""}</text>
        </g>
      ))}
    </svg>
  );
}
