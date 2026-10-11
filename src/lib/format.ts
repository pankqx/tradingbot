const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const price = (n: number, d = 2) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

export const signedPct = (n: number, d = 2) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(d)}%`;
export const signed = (n: number, d = 2) => `${n >= 0 ? "+" : "−"}${price(Math.abs(n), d)}`;

/** "2026-10-09" -> "9 Oct 2026" (locale independent so server and client agree). */
export function shortDate(iso: string, withYear = false): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** Compact Indian-style magnitude, e.g. 12.4 Cr. */
export function crore(n: number): string {
  const cr = n / 1e7;
  if (cr >= 100) return `₹${Math.round(cr).toLocaleString("en-IN")} Cr`;
  if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
  return `₹${(n / 1e5).toFixed(1)} L`;
}

export const STATUS_LABEL = {
  bullish: "Bullish", bearish: "Bearish", neutral: "Neutral", insufficient_data: "Insufficient data",
} as const;

export const OUTCOME_LABEL = {
  active: "Active", target_reached: "Target reached", invalidated: "Invalidated", expired: "Expired",
} as const;
