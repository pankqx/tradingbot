"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries, CrosshairMode, HistogramSeries, LineSeries, LineStyle, createChart, createSeriesMarkers,
  type IChartApi, type ISeriesApi, type ISeriesPrimitive, type LogicalRange, type Time,
} from "lightweight-charts";
import { useResolvedTheme } from "./theme";
import { price, shortDate } from "@/lib/format";
import type { Candle, Series } from "@/lib/analytics/types";

export interface ChartIndicators {
  sma20: Series; sma50: Series; sma200: Series;
  bbUpper: Series; bbLower: Series; bbMid: Series;
  rsi: Series; macdLine: Series; macdSignal: Series; macdHist: Series;
}

export interface ChartSetup {
  direction: "bullish" | "bearish";
  entry: number;
  stop: number;
  targets: { label: string; price: number }[];
  fromDate: string;
}

export interface ChartMarker { date: string; direction: "bullish" | "bearish"; label: string }

type Overlay = "sma20" | "sma50" | "sma200" | "bb";
type Panel = "volume" | "rsi" | "macd";

const RANGES = [{ id: "3M", bars: 63 }, { id: "6M", bars: 126 }, { id: "1Y", bars: 252 }, { id: "All", bars: 9999 }];

function palette() {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string) => s.getPropertyValue(n).trim();
  return {
    ink: g("--ink"), text: g("--chart-text"), grid: g("--chart-grid"), cross: g("--chart-cross"), paper: g("--surface"), line: g("--line-strong"),
    up: g("--up"), down: g("--down"), accent: g("--accent"), warn: g("--warn"), ink2: g("--ink-2"),
  };
}
type Palette = ReturnType<typeof palette>;

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Draws the risk and reward zones of a signal directly on the price pane. */
function makePrimitive(setup: ChartSetup, c: Palette): ISeriesPrimitive<Time> {
  let chart: IChartApi | undefined;
  let series: ISeriesApi<"Candlestick"> | undefined;
  const lastTarget = setup.targets[setup.targets.length - 1]?.price ?? setup.entry;
  return {
    attached(p) { chart = p.chart as IChartApi; series = p.series as ISeriesApi<"Candlestick">; },
    detached() { chart = undefined; series = undefined; },
    paneViews() {
      return [{
        zOrder: () => "bottom" as const,
        renderer: () => ({
          draw: (target) => {
            if (!chart || !series) return;
            target.useBitmapCoordinateSpace(({ context: ctx, bitmapSize, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
              const yE = series!.priceToCoordinate(setup.entry);
              const yS = series!.priceToCoordinate(setup.stop);
              const yT = series!.priceToCoordinate(lastTarget);
              if (yE == null || yS == null) return;
              const xRaw = chart!.timeScale().timeToCoordinate(setup.fromDate as Time);
              const x0 = Math.max(0, (xRaw ?? 0) * hr);
              const w = bitmapSize.width - x0;
              if (w <= 0) return;
              const fill = (y1: number, y2: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x0, Math.min(y1, y2) * vr, w, Math.abs(y2 - y1) * vr); };
              fill(yE, yS, alpha(c.down, 0.12));
              if (yT != null) fill(yE, yT, alpha(c.up, 0.11));
              const line = (y: number, color: string, dash: number[], label: string) => {
                ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, hr); ctx.setLineDash(dash.map((d) => d * hr));
                ctx.beginPath(); ctx.moveTo(x0, y * vr); ctx.lineTo(bitmapSize.width, y * vr); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = color; ctx.font = `${11 * hr}px "IBM Plex Sans", sans-serif`; ctx.textBaseline = "bottom";
                ctx.fillText(label, x0 + 8 * hr, y * vr - 4 * vr);
              };
              line(yE, c.warn, [], `Entry reference ${price(setup.entry)}`);
              line(yS, c.down, [5, 4], `Stop ${price(setup.stop)}`);
              setup.targets.forEach((t) => { const y = series!.priceToCoordinate(t.price); if (y != null) line(y, c.up, [5, 4], `${t.label} ${price(t.price)}`); });
            });
          },
        }),
      }];
    },
  };
}

export function PriceChart({ candles, ind, setup, markers = [], symbol }: { candles: Candle[]; ind: ChartIndicators; setup?: ChartSetup | null; markers?: ChartMarker[]; symbol: string }) {
  const theme = useResolvedTheme();
  const host = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<LogicalRange | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [overlays, setOverlays] = useState<Set<Overlay>>(new Set(["sma50", "sma200"]));
  const [panels, setPanels] = useState<Set<Panel>>(new Set(["volume"]));
  const [hover, setHover] = useState<Candle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); apply(n); };
  const byDate = useMemo(() => new Map(candles.map((c) => [c.date, c])), [candles]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let chart: IChartApi;
    try {
      const c = palette();
      chart = createChart(el, {
        autoSize: true,
        localization: { locale: "en-IN" },
        layout: { background: { color: "transparent" }, textColor: c.text, fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 12, panes: { separatorColor: c.line, separatorHoverColor: alpha(c.accent, 0.3) } },
        grid: { vertLines: { visible: false }, horzLines: { color: c.grid } },
        rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.04 } },
        timeScale: { borderVisible: false, timeVisible: false, rightOffset: 8, minBarSpacing: 3 },
        crosshair: { mode: CrosshairMode.Normal, vertLine: { color: c.cross, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.ink }, horzLine: { color: c.cross, width: 1, style: LineStyle.Dashed, labelBackgroundColor: c.ink } },
      });
      chartRef.current = chart;
      const t = (d: string) => d as Time;

      const main = chart.addSeries(CandlestickSeries, {
        upColor: c.up, downColor: c.down, borderUpColor: c.up, borderDownColor: c.down, wickUpColor: c.up, wickDownColor: c.down, priceLineVisible: false,
      }, 0);
      main.setData(candles.map((k) => ({ time: t(k.date), open: k.open, high: k.high, low: k.low, close: k.close })));

      const line = (s: Series, color: string, w = 1.5, dashed = false) => {
        const ls = chart.addSeries(LineSeries, { color, lineWidth: Math.round(w) as 1 | 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid }, 0);
        ls.setData(candles.flatMap((k, i) => (s[i] != null ? [{ time: t(k.date), value: s[i]! }] : [])));
      };
      if (overlays.has("sma20")) line(ind.sma20, c.accent, 1);
      if (overlays.has("sma50")) line(ind.sma50, c.warn, 1);
      if (overlays.has("sma200")) line(ind.sma200, c.ink2, 1);
      if (overlays.has("bb")) { line(ind.bbUpper, alpha(c.ink2, 0.7), 1, true); line(ind.bbLower, alpha(c.ink2, 0.7), 1, true); line(ind.bbMid, alpha(c.ink2, 0.45), 1, true); }

      if (panels.has("volume")) {
        const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol", priceLineVisible: false, lastValueVisible: false }, 0);
        chart.priceScale("vol", 0).applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
        vol.setData(candles.map((k) => ({ time: t(k.date), value: k.volume, color: alpha(k.close >= k.open ? c.up : c.down, 0.35) })));
      }

      let pane = 1;
      const panesToStretch: number[] = [];
      if (panels.has("rsi")) {
        const r = chart.addSeries(LineSeries, { color: c.accent, lineWidth: 2, priceLineVisible: false, lastValueVisible: true }, pane);
        r.setData(candles.flatMap((k, i) => (ind.rsi[i] != null ? [{ time: t(k.date), value: ind.rsi[i]! }] : [])));
        r.createPriceLine({ price: 70, color: alpha(c.down, 0.6), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
        r.createPriceLine({ price: 30, color: alpha(c.up, 0.6), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
        panesToStretch.push(pane++);
      }
      if (panels.has("macd")) {
        const h = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
        h.setData(candles.flatMap((k, i) => (ind.macdHist[i] != null ? [{ time: t(k.date), value: ind.macdHist[i]!, color: alpha(ind.macdHist[i]! >= 0 ? c.up : c.down, 0.55) }] : [])));
        const m = chart.addSeries(LineSeries, { color: c.ink, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
        m.setData(candles.flatMap((k, i) => (ind.macdLine[i] != null ? [{ time: t(k.date), value: ind.macdLine[i]! }] : [])));
        const sg = chart.addSeries(LineSeries, { color: c.warn, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
        sg.setData(candles.flatMap((k, i) => (ind.macdSignal[i] != null ? [{ time: t(k.date), value: ind.macdSignal[i]! }] : [])));
        panesToStretch.push(pane++);
      }
      const panes = chart.panes();
      panes[0]?.setStretchFactor(Math.max(1, 3 - panesToStretch.length * 0.6));
      panesToStretch.forEach((p) => panes[p]?.setStretchFactor(1));

      if (setup) {
        main.attachPrimitive(makePrimitive(setup, c));
        main.createPriceLine({ price: setup.entry, color: c.warn, lineVisible: false, axisLabelVisible: true, title: "Entry" });
        main.createPriceLine({ price: setup.stop, color: c.down, lineVisible: false, axisLabelVisible: true, title: "Stop" });
        setup.targets.forEach((tg) => main.createPriceLine({ price: tg.price, color: c.up, lineVisible: false, axisLabelVisible: true, title: tg.label.split(" ")[0] }));
      }
      const ms = [...markers].sort((a, b) => a.date.localeCompare(b.date)).map((m) => ({
        time: t(m.date), position: m.direction === "bullish" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: m.direction === "bullish" ? ("arrowUp" as const) : ("arrowDown" as const),
        color: m.direction === "bullish" ? c.up : c.down, text: m.label, size: 1,
      }));
      if (ms.length) createSeriesMarkers(main, ms);

      chart.subscribeCrosshairMove((p) => {
        const k = p.time ? byDate.get(p.time as string) : undefined;
        setHover(k ?? null);
      });

      const n = candles.length;
      const saved = rangeRef.current;
      chart.timeScale().setVisibleLogicalRange(saved ?? { from: n - 126, to: n + 8 });
      chart.timeScale().subscribeVisibleLogicalRangeChange((r) => { if (r) rangeRef.current = r; });
      queueMicrotask(() => setError(null));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "The chart could not be drawn.";
      queueMicrotask(() => setError(msg));
      return;
    }
    return () => { chart.remove(); chartRef.current = null; };
  }, [candles, ind, setup, markers, overlays, panels, theme, byDate]);

  const setRange = (bars: number) => {
    const n = candles.length;
    const r = { from: Math.max(-2, n - Math.min(bars, n)), to: n + 8 } as unknown as LogicalRange;
    rangeRef.current = r;
    chartRef.current?.timeScale().setVisibleLogicalRange(r);
  };

  const last = candles[candles.length - 1];
  const shown = hover ?? last;
  const prev = candles[Math.max(0, candles.findIndex((k) => k.date === shown.date) - 1)];
  const chg = ((shown.close - prev.close) / prev.close) * 100;

  const chip = (on: boolean) => `rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-line-strong"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3">
        <div role="group" aria-label="Timeframe" className="flex items-center gap-1">
          <button className={chip(true)} aria-pressed>1D</button>
          {["1h", "15m", "5m"].map((tf) => <button key={tf} disabled title="Intraday candles need a live or licensed intraday data source." className="cursor-not-allowed rounded-full border border-dashed border-line px-2.5 py-1 text-[12.5px] text-ink-3/70">{tf}</button>)}
        </div>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <div role="group" aria-label="Range" className="flex items-center gap-1">
          {RANGES.map((r) => <button key={r.id} onClick={() => setRange(r.bars)} className={chip(false)}>{r.id}</button>)}
        </div>
        <span className="hidden h-5 w-px bg-line sm:block" />
        <div role="group" aria-label="Indicators" className="flex flex-wrap items-center gap-1">
          {([["sma20", "SMA 20"], ["sma50", "SMA 50"], ["sma200", "SMA 200"], ["bb", "Bollinger"]] as [Overlay, string][]).map(([k, l]) => (
            <button key={k} aria-pressed={overlays.has(k)} onClick={() => toggle(overlays, k, setOverlays)} className={chip(overlays.has(k))}>{l}</button>
          ))}
          {([["volume", "Volume"], ["rsi", "RSI"], ["macd", "MACD"]] as [Panel, string][]).map(([k, l]) => (
            <button key={k} aria-pressed={panels.has(k)} onClick={() => toggle(panels, k, setPanels)} className={chip(panels.has(k))}>{l}</button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="num pointer-events-none absolute left-2 top-1 z-10 flex flex-wrap items-center gap-x-4 gap-y-0.5 rounded-md bg-paper/80 px-2 py-1 text-[12.5px] backdrop-blur-sm" aria-live="off">
          <span className="font-medium">{symbol}</span>
          <span className="text-ink-3">{shortDate(shown.date, true)}</span>
          <span>O <b className="font-medium">{price(shown.open)}</b></span>
          <span>H <b className="font-medium">{price(shown.high)}</b></span>
          <span>L <b className="font-medium">{price(shown.low)}</b></span>
          <span>C <b className="font-medium">{price(shown.close)}</b></span>
          <span className={chg >= 0 ? "text-up" : "text-down"}>{chg >= 0 ? "+" : "−"}{Math.abs(chg).toFixed(2)}%</span>
          <span className="text-ink-3">Vol {(shown.volume / 1e5).toFixed(1)} L</span>
        </div>
        <div ref={host} className="h-[420px] w-full md:h-[560px]" role="img" aria-label={`${symbol} daily candlestick chart with indicators. Simulated data.`} />
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-paper/90 text-center">
            <div><p className="font-medium">The chart could not be drawn</p><p className="mt-1 max-w-sm text-[13.5px] text-ink-2">{error}. Reload the page; if it persists, your browser may be blocking canvas rendering.</p></div>
          </div>
        )}
      </div>
      <p className="pt-2 text-[12.5px] text-ink-3">Daily candles · simulated data, not exchange prices · charts by TradingView Lightweight Charts™</p>
    </div>
  );
}
