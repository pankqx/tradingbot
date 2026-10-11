import { price, shortDate } from "@/lib/format";
import type { SignalRecord } from "./types";

/** Plain-language narrative generated from the numbers on the record (no embellishment). */
export function explainSignal(s: SignalRecord): string[] {
  const long = s.direction === "bullish";
  const riskPct = (Math.abs(s.entryRef - s.stop) / s.entryRef) * 100;
  const out: string[] = [];
  out.push(`On ${shortDate(s.generatedOn, true)}, ${s.symbol} closed at ${price(s.entryRef)} and the “${s.strategy.name}” rule produced a ${s.direction} hypothesis. This rule looks at ${ruleFocus(s.strategy.id)}.`);
  out.push(`The idea is invalidated if price ${long ? "trades down to" : "trades up to"} ${price(s.stop)}, which is ${riskPct.toFixed(1)}% from the reference price (a distance based on the stock’s recent daily range, ATR ${price(s.indicators.atr14)}). That distance is the “1R” unit used below.`);
  if (s.targets.length) {
    out.push(`The first target sits at ${price(s.targets[0].price)}, a reward-to-risk of ${(s.riskReward ?? 0).toFixed(1)}. Targets are fixed multiples of the risk distance, not forecasts of where price will go.`);
  } else {
    out.push("No target is shown because the rule does not define one that offers at least 1R of reward.");
  }
  out.push(`The hypothesis is meant to be judged within ${s.horizonBars} trading days${s.expiresOn ? ` (until ${shortDate(s.expiresOn)})` : ""}. After that it expires, whether or not it worked.`);
  if (s.conflicting.length) out.push(`Read the conflicting evidence before relying on it: ${s.conflicting.length} point${s.conflicting.length > 1 ? "s" : ""} argue against this setup.`);
  return out;
}

function ruleFocus(id: SignalRecord["strategy"]["id"]) {
  switch (id) {
    case "trend-ma": return "whether price and the 50- and 200-day averages are stacked in one direction";
    case "momentum-rsi-macd": return "whether RSI and the MACD histogram agree and are strengthening";
    case "breakout-volume": return "whether price has left its 20-day range on unusually high volume";
    case "mean-reversion": return "short-term stretches that tend to snap back when the long-term trend is intact";
  }
}
