import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Bar, ChartType, IndicatorType } from '../types/market';
import {
  bollingerSeries,
  emaSeries,
  fmt,
  heikinAshi,
  macdSeries,
  rsiSeries,
  smaSeries,
  stochasticSeries,
  vnDate,
} from '../services/marketService';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  bars: Bar[];
  height?: number;
  expand?: boolean;
  onFullscreen?: () => void;
  chartType?: ChartType;
  indicators?: Set<IndicatorType>;
  rangeList?: [string, number][];
  initialRangeIndex?: number;
  isDark?: boolean;
}

const DEFAULT_RANGES: [string, number][] = [
  ['1T', 22],
  ['3T', 66],
  ['6T', 130],
  ['1N', 250],
  ['5N', 1250],
  ['Tất cả', 0],
];

const INDICATOR_CONFIGS: Record<IndicatorType, { label: string; color: string; isPane: boolean }> = {
  ma10: { label: 'MA 10', color: '#9575CD', isPane: false },
  ma20: { label: 'MA 20', color: '#2962FF', isPane: false },
  ma50: { label: 'MA 50', color: '#FF9800', isPane: false },
  ma200: { label: 'MA 200', color: '#E91E63', isPane: false },
  ema20: { label: 'EMA 20', color: '#00BCD4', isPane: false },
  bollinger: { label: 'BB (20,2)', color: '#9C27B0', isPane: false },
  volume: { label: 'Khối lượng', color: '#26A69A', isPane: true },
  rsi: { label: 'RSI 14', color: '#7E57C2', isPane: true },
  macd: { label: 'MACD (12,26,9)', color: '#2962FF', isPane: true },
  stoch: { label: 'Stoch (14,3)', color: '#00E676', isPane: true },
};

export const StockChart: React.FC<StockChartProps> = ({
  symbol,
  bars: rawBars,
  height = 400,
  expand = false,
  onFullscreen,
  chartType: externalChartType,
  indicators: externalIndicators,
  rangeList = DEFAULT_RANGES,
  initialRangeIndex = 2,
  isDark = true,
}) => {
  const [internalChartType, setInternalChartType] = useState<ChartType>('candle');
  const [internalIndicators, setInternalIndicators] = useState<Set<IndicatorType>>(
    new Set(['ma20', 'ma50', 'volume'])
  );

  const chartType = externalChartType ?? internalChartType;
  const activeIndicators = externalIndicators ?? internalIndicators;

  const [rangeIndex, setRangeIndex] = useState<number>(initialRangeIndex);
  const [viewportEnd, setViewportEnd] = useState<number>(0);
  const [viewportCount, setViewportCount] = useState<number>(130);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const startEndRef = useRef<number>(0);

  const displayBars = useMemo(() => {
    if (chartType === 'heikinAshi') {
      return heikinAshi(rawBars);
    }
    return rawBars;
  }, [rawBars, chartType]);

  const indicatorData = useMemo(() => {
    const closes = displayBars.map((b) => b.c);
    return {
      ma10: activeIndicators.has('ma10') ? smaSeries(closes, 10) : null,
      ma20: activeIndicators.has('ma20') ? smaSeries(closes, 20) : null,
      ma50: activeIndicators.has('ma50') ? smaSeries(closes, 50) : null,
      ma200: activeIndicators.has('ma200') ? smaSeries(closes, 200) : null,
      ema20: activeIndicators.has('ema20') ? emaSeries(closes, 20) : null,
      bollinger: activeIndicators.has('bollinger') ? bollingerSeries(closes, 20, 2) : null,
      rsi: activeIndicators.has('rsi') ? rsiSeries(closes, 14) : null,
      macd: activeIndicators.has('macd') ? macdSeries(closes) : null,
      stoch: activeIndicators.has('stoch') ? stochasticSeries(displayBars, 14, 3) : null,
    };
  }, [displayBars, activeIndicators]);

  useEffect(() => {
    const range = rangeList[rangeIndex];
    if (!range) return;
    const targetCount = range[1] === 0 ? displayBars.length : range[1];
    setViewportCount(Math.min(displayBars.length, Math.max(15, targetCount)));
    setViewportEnd(0);
  }, [rangeIndex, rangeList, displayBars.length]);

  const activePanes = useMemo(() => {
    const panes: IndicatorType[] = [];
    if (activeIndicators.has('volume')) panes.push('volume');
    if (activeIndicators.has('rsi')) panes.push('rsi');
    if (activeIndicators.has('macd')) panes.push('macd');
    if (activeIndicators.has('stoch')) panes.push('stoch');
    return panes;
  }, [activeIndicators]);

  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayBars.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 600;
    const currentHeight = expand ? (canvas.parentElement?.clientHeight || height) : height;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = currentHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${currentHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, currentHeight);

    const totalBars = displayBars.length;
    const count = Math.min(totalBars, Math.max(10, Math.round(viewportCount)));
    const endIdx = Math.max(0, Math.min(totalBars - count, Math.round(viewportEnd)));
    const startIdx = Math.max(0, totalBars - count - endIdx);
    const visibleBars = displayBars.slice(startIdx, startIdx + count);

    if (visibleBars.length === 0) return;

    const rightAxisWidth = 56;
    const bottomAxisHeight = 22;
    const topMargin = 16;
    const paneGap = 8;
    const chartAreaWidth = width - rightAxisWidth;

    const subPaneCount = activePanes.length;
    const subPaneHeight = subPaneCount > 0 ? Math.min(68, (currentHeight - 120) / (subPaneCount + 2)) : 0;
    const totalSubHeight = subPaneCount * (subPaneHeight + paneGap);
    const mainPaneHeight = currentHeight - topMargin - bottomAxisHeight - totalSubHeight;

    const barWidth = chartAreaWidth / visibleBars.length;
    const candleWidth = Math.max(1, barWidth * 0.72);

    const upColor = isDark ? '#26A69A' : '#0F8A4A';
    const downColor = isDark ? '#EF5350' : '#C8322B';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#8FAFCB' : '#526B84';

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const b of visibleBars) {
      minPrice = Math.min(minPrice, b.l);
      maxPrice = Math.max(maxPrice, b.h);
    }

    if (indicatorData.bollinger) {
      for (let i = startIdx; i < startIdx + count; i++) {
        const u = indicatorData.bollinger.upper[i];
        const l = indicatorData.bollinger.lower[i];
        if (u != null) maxPrice = Math.max(maxPrice, u);
        if (l != null) minPrice = Math.min(minPrice, l);
      }
    }
    const pricePadding = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceSpan = maxPrice - minPrice;

    const getY = (price: number) => topMargin + mainPaneHeight - ((price - minPrice) / priceSpan) * mainPaneHeight;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const priceSteps = 5;
    ctx.font = '10px Roboto, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (priceSpan / priceSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartAreaWidth, y);
      ctx.stroke();

      ctx.fillText(fmt(p, 1), chartAreaWidth + 6, y);
    }

    if (chartType === 'line' || chartType === 'area' || chartType === 'baseline') {
      ctx.beginPath();
      visibleBars.forEach((b, i) => {
        const x = i * barWidth + barWidth / 2;
        const y = getY(b.c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (chartType === 'area') {
        const firstX = barWidth / 2;
        const lastX = (visibleBars.length - 1) * barWidth + barWidth / 2;
        const areaPath = new Path2D();
        areaPath.moveTo(firstX, getY(visibleBars[0].c));
        visibleBars.forEach((b, i) => {
          areaPath.lineTo(i * barWidth + barWidth / 2, getY(b.c));
        });
        areaPath.lineTo(lastX, topMargin + mainPaneHeight);
        areaPath.lineTo(firstX, topMargin + mainPaneHeight);
        areaPath.closePath();

        const grad = ctx.createLinearGradient(0, topMargin, 0, topMargin + mainPaneHeight);
        grad.addColorStop(0, isDark ? 'rgba(41, 98, 255, 0.28)' : 'rgba(22, 58, 95, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill(areaPath);
      }

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#2962FF';
      ctx.stroke();
    } else {
      visibleBars.forEach((b, i) => {
        const x = i * barWidth + barWidth / 2;
        const openY = getY(b.o);
        const closeY = getY(b.c);
        const highY = getY(b.h);
        const lowY = getY(b.l);
        const isBull = b.c >= b.o;
        const color = isBull ? upColor : downColor;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1;

        if (chartType === 'ohlc') {
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x - candleWidth / 2, openY);
          ctx.lineTo(x, openY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x + candleWidth / 2, closeY);
          ctx.lineTo(x, closeY);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();

          const top = Math.min(openY, closeY);
          const bodyH = Math.max(1.5, Math.abs(openY - closeY));
          const left = x - candleWidth / 2;

          if (chartType === 'hollow' && isBull) {
            ctx.strokeRect(left, top, candleWidth, bodyH);
          } else {
            ctx.fillRect(left, top, candleWidth, bodyH);
          }
        }
      });
    }

    const renderLineSeries = (data: (number | null)[] | null, color: string, width = 1.2) => {
      if (!data) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      let started = false;
      for (let i = 0; i < count; i++) {
        const globalIdx = startIdx + i;
        const val = data[globalIdx];
        if (val != null) {
          const x = i * barWidth + barWidth / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    renderLineSeries(indicatorData.ma10, INDICATOR_CONFIGS.ma10.color);
    renderLineSeries(indicatorData.ma20, INDICATOR_CONFIGS.ma20.color);
    renderLineSeries(indicatorData.ma50, INDICATOR_CONFIGS.ma50.color);
    renderLineSeries(indicatorData.ma200, INDICATOR_CONFIGS.ma200.color);
    renderLineSeries(indicatorData.ema20, INDICATOR_CONFIGS.ema20.color);

    if (indicatorData.bollinger) {
      renderLineSeries(indicatorData.bollinger.upper, INDICATOR_CONFIGS.bollinger.color, 1);
      renderLineSeries(indicatorData.bollinger.mid, INDICATOR_CONFIGS.bollinger.color, 0.8);
      renderLineSeries(indicatorData.bollinger.lower, INDICATOR_CONFIGS.bollinger.color, 1);
    }

    let currentYOffset = topMargin + mainPaneHeight + paneGap;

    activePanes.forEach((pane) => {
      ctx.strokeStyle = gridColor;
      ctx.strokeRect(0, currentYOffset, chartAreaWidth, subPaneHeight);

      ctx.font = '10px Roboto, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(INDICATOR_CONFIGS[pane].label, 6, currentYOffset + 4);

      if (pane === 'volume') {
        const maxVol = Math.max(...visibleBars.map((b) => b.v), 1);
        visibleBars.forEach((b, i) => {
          const x = i * barWidth + barWidth / 2;
          const vHeight = (b.v / maxVol) * (subPaneHeight - 14);
          const y = currentYOffset + subPaneHeight - vHeight;
          const isBull = b.c >= b.o;
          ctx.fillStyle = isBull ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)';
          ctx.fillRect(x - candleWidth / 2, y, candleWidth, vHeight);
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${(maxVol / 1e6).toFixed(1)}M`, chartAreaWidth + 6, currentYOffset + 8);
      } else if (pane === 'rsi' && indicatorData.rsi) {
        const y70 = currentYOffset + subPaneHeight - (70 / 100) * subPaneHeight;
        const y30 = currentYOffset + subPaneHeight - (30 / 100) * subPaneHeight;
        ctx.strokeStyle = 'rgba(126, 87, 194, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y70);
        ctx.lineTo(chartAreaWidth, y70);
        ctx.moveTo(0, y30);
        ctx.lineTo(chartAreaWidth, y30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.strokeStyle = INDICATOR_CONFIGS.rsi.color;
        ctx.lineWidth = 1.3;
        let started = false;
        for (let i = 0; i < count; i++) {
          const val = indicatorData.rsi[startIdx + i];
          if (val != null) {
            const x = i * barWidth + barWidth / 2;
            const y = currentYOffset + subPaneHeight - (val / 100) * subPaneHeight;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.fillText('70', chartAreaWidth + 6, y70);
        ctx.fillText('30', chartAreaWidth + 6, y30);
      } else if (pane === 'macd' && indicatorData.macd) {
        const histSlice = indicatorData.macd.hist.slice(startIdx, startIdx + count).filter((x) => x != null) as number[];
        const maxMacd = Math.max(0.1, ...histSlice.map(Math.abs));
        const zeroY = currentYOffset + subPaneHeight / 2;

        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(chartAreaWidth, zeroY);
        ctx.stroke();

        for (let i = 0; i < count; i++) {
          const hVal = indicatorData.macd.hist[startIdx + i];
          if (hVal != null) {
            const x = i * barWidth + barWidth / 2;
            const barH = (hVal / maxMacd) * (subPaneHeight / 2 - 4);
            ctx.fillStyle = hVal >= 0 ? upColor : downColor;
            ctx.fillRect(x - candleWidth / 2, zeroY - (hVal >= 0 ? barH : 0), candleWidth, Math.abs(barH));
          }
        }
      } else if (pane === 'stoch' && indicatorData.stoch) {
        const renderStochLine = (arr: (number | null)[], col: string) => {
          ctx.beginPath();
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          let started = false;
          for (let i = 0; i < count; i++) {
            const val = arr[startIdx + i];
            if (val != null) {
              const x = i * barWidth + barWidth / 2;
              const y = currentYOffset + subPaneHeight - (val / 100) * subPaneHeight;
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        };
        renderStochLine(indicatorData.stoch.k, '#00E676');
        renderStochLine(indicatorData.stoch.d, '#FF5252');
      }

      currentYOffset += subPaneHeight + paneGap;
    });

    ctx.font = '10px Roboto, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const timeSteps = Math.min(6, visibleBars.length);
    for (let i = 0; i < timeSteps; i++) {
      const idx = Math.floor((i / (timeSteps - 1 || 1)) * (visibleBars.length - 1));
      const b = visibleBars[idx];
      const x = idx * barWidth + barWidth / 2;
      const dateStr = vnDate(b.t).substring(5);
      ctx.fillText(dateStr, x, currentHeight - bottomAxisHeight + 4);
    }

    if (hoverIndex != null && hoverIndex >= 0 && hoverIndex < visibleBars.length) {
      const hoveredBar = visibleBars[hoverIndex];
      const crossX = hoverIndex * barWidth + barWidth / 2;
      const crossY = getY(hoveredBar.c);

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(crossX, 0);
      ctx.lineTo(crossX, currentHeight - bottomAxisHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, crossY);
      ctx.lineTo(chartAreaWidth, crossY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isDark ? '#163A5F' : '#0F8A4A';
      ctx.fillRect(chartAreaWidth, crossY - 9, rightAxisWidth, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fmt(hoveredBar.c, 2), chartAreaWidth + 4, crossY);

      const dateLabel = vnDate(hoveredBar.t);
      ctx.fillStyle = isDark ? '#163A5F' : '#DCE4ED';
      ctx.fillRect(crossX - 35, currentHeight - bottomAxisHeight + 2, 70, 16);
      ctx.fillStyle = isDark ? '#FFFFFF' : '#111923';
      ctx.textAlign = 'center';
      ctx.fillText(dateLabel, crossX, currentHeight - bottomAxisHeight + 10);
    }
  }, [
    displayBars,
    height,
    expand,
    viewportCount,
    viewportEnd,
    hoverIndex,
    chartType,
    activeIndicators,
    activePanes,
    indicatorData,
    isDark,
  ]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  useEffect(() => {
    const handleResize = () => renderChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    startEndRef.current = viewportEnd;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartAreaWidth = rect.width - 56;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      const barWidth = chartAreaWidth / viewportCount;
      const barsDelta = deltaX / barWidth;
      const maxEnd = Math.max(0, displayBars.length - viewportCount);
      const nextEnd = Math.max(0, Math.min(maxEnd, startEndRef.current + barsDelta));
      setViewportEnd(nextEnd);
    } else {
      if (x >= 0 && x <= chartAreaWidth) {
        const barWidth = chartAreaWidth / viewportCount;
        const index = Math.floor(x / barWidth);
        setHoverIndex(index);
      } else {
        setHoverIndex(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    const nextCount = Math.max(15, Math.min(displayBars.length, viewportCount * factor));
    setViewportCount(nextCount);
  };

  const hoveredBar = useMemo(() => {
    if (hoverIndex == null || displayBars.length === 0) {
      return displayBars[displayBars.length - 1];
    }
    const totalBars = displayBars.length;
    const count = Math.min(totalBars, Math.max(10, Math.round(viewportCount)));
    const endIdx = Math.max(0, Math.min(totalBars - count, Math.round(viewportEnd)));
    const startIdx = Math.max(0, totalBars - count - endIdx);
    return displayBars[startIdx + hoverIndex] || displayBars[displayBars.length - 1];
  }, [hoverIndex, displayBars, viewportCount, viewportEnd]);

  const change1d = useMemo(() => {
    if (!hoveredBar) return 0;
    return hoveredBar.c - hoveredBar.o;
  }, [hoveredBar]);

  const pct1d = useMemo(() => {
    if (!hoveredBar || hoveredBar.o === 0) return 0;
    return (change1d / hoveredBar.o) * 100;
  }, [hoveredBar, change1d]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white dark:bg-[#182331] rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] p-3 ${
        expand ? 'h-full' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DCE4ED] dark:border-[#2B3948] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-[#163A5F] dark:text-[#82B7E8]">
            {symbol}
          </span>
          {hoveredBar && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="text-gray-500">{vnDate(hoveredBar.t)}</span>
              <span>
                Mở: <b>{fmt(hoveredBar.o)}</b>
              </span>
              <span>
                Cao: <b>{fmt(hoveredBar.h)}</b>
              </span>
              <span>
                Thấp: <b>{fmt(hoveredBar.l)}</b>
              </span>
              <span>
                Đóng: <b>{fmt(hoveredBar.c)}</b>
              </span>
              <span className={pct1d >= 0 ? 'text-[#0F8A4A] dark:text-[#3ECF7F]' : 'text-[#C8322B] dark:text-[#FF6B62]'}>
                {pct1d >= 0 ? '+' : ''}
                {fmt(pct1d)}%
              </span>
              <span className="text-gray-400">
                KL: <b>{fmt(hoveredBar.v, 0)}</b>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={chartType}
            onChange={(e) => setInternalChartType(e.target.value as ChartType)}
            className="px-2 py-1 bg-gray-100 dark:bg-[#111923] border border-[#DCE4ED] dark:border-[#2B3948] rounded text-xs"
          >
            <option value="candle">Nến Nhật</option>
            <option value="hollow">Nến rỗng</option>
            <option value="ohlc">Thanh OHLC</option>
            <option value="line">Đường</option>
            <option value="area">Vùng</option>
            <option value="heikinAshi">Heikin-Ashi</option>
          </select>

          <div className="relative group">
            <button className="px-2 py-1 bg-gray-100 dark:bg-[#111923] border border-[#DCE4ED] dark:border-[#2B3948] rounded text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-[#202E3F]">
              Chỉ báo ({activeIndicators.size})
            </button>
            <div className="hidden group-hover:flex flex-col absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] rounded shadow-lg p-2 z-30 text-xs">
              {(Object.keys(INDICATOR_CONFIGS) as IndicatorType[]).map((key) => (
                <label key={key} className="flex items-center gap-2 py-1 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={activeIndicators.has(key)}
                    onChange={() => {
                      const next = new Set(activeIndicators);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      setInternalIndicators(next);
                    }}
                  />
                  <span style={{ color: INDICATOR_CONFIGS[key].color }}>
                    {INDICATOR_CONFIGS[key].label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => setViewportCount((prev) => Math.max(15, prev * 0.8))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#202E3F] rounded"
            title="Phóng to"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setViewportCount((prev) => Math.min(displayBars.length, prev * 1.25))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#202E3F] rounded"
            title="Thu nhỏ"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => {
              setViewportEnd(0);
              setViewportCount(130);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#202E3F] rounded"
            title="Đặt lại góc nhìn"
          >
            <RotateCcw size={15} />
          </button>

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1 hover:bg-gray-100 dark:hover:bg-[#202E3F] rounded"
              title="Toàn màn hình"
            >
              <Maximize2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div
        className="relative flex-1 cursor-crosshair select-none my-1 overflow-hidden"
        style={{ minHeight: height }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#DCE4ED] dark:border-[#2B3948] text-xs">
        <div className="flex items-center gap-1">
          {rangeList.map(([label], idx) => (
            <button
              key={label}
              onClick={() => setRangeIndex(idx)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                rangeIndex === idx
                  ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-gray-400">
          Cuộn chuột để zoom · Kéo chuột để di chuyển phiên
        </div>
      </div>
    </div>
  );
};
