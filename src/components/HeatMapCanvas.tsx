import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { BoardRow, HeatMetric, SectorInfo } from '../types/market';
import { fmt } from '../services/marketService';
import { groupBySector, layoutTwoLevel, PlacedGroup, Rect } from '../services/treemapService';

interface HeatMapCanvasProps {
  rows: BoardRow[];
  sectors: Record<string, SectorInfo>;
  metric: HeatMetric;
  onOpen: (symbol: string) => void;
  isDark?: boolean;
}

export const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({
  rows,
  sectors,
  metric,
  onOpen,
  isDark = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const rowsBySymbol = useMemo(() => {
    const map: Record<string, BoardRow> = {};
    for (const r of rows) map[r.symbol] = r;
    return map;
  }, [rows]);

  const maxValues = useMemo(() => {
    let maxForeign = 1;
    let maxLiquidity = 1;
    for (const r of rows) {
      const net = Math.abs(r.foreignBuy - r.foreignSell);
      if (net > maxForeign) maxForeign = net;
      const liq = r.valueMn + r.ptValueMn;
      if (liq > maxLiquidity) maxLiquidity = liq;
    }
    return { maxForeign, maxLiquidity };
  }, [rows]);

  const [placedGroups, setPlacedGroups] = useState<PlacedGroup[]>([]);

  const calculateLayout = useCallback((width: number, height: number) => {
    if (width <= 0 || height <= 0 || rows.length === 0) return [];
    const groups = groupBySector(rows, sectors);
    const noValue = rows.every((r) => r.valueMn + r.ptValueMn <= 0);
    const weightFn = (r: BoardRow) =>
      noValue ? sectors[r.symbol]?.marketCap ?? 0 : r.valueMn + r.ptValueMn;

    const bounds: Rect = { x: 0, y: 0, w: width, h: height };
    const treeGroups = groups.map((g) => ({
      name: g.name,
      items: g.rows.map((r) => ({ id: r.symbol, weight: weightFn(r) })),
      weight: g.weight,
    }));

    return layoutTwoLevel(treeGroups, bounds, 16, 2);
  }, [rows, sectors]);

  const getTileColor = useCallback(
    (row: BoardRow): string => {
      if (metric === 'change') {
        if (row.atCeil) return '#B04DFF';
        if (row.atFloor) return '#1EC8E0';
        if (row.dir === 0) return '#D8B400';
        const t = Math.min(1, Math.abs(row.pct) / 6);
        return row.dir > 0
          ? `rgb(${Math.round(22 + (22 - 22) * t)}, ${Math.round(138 + (176 - 138) * t)}, ${Math.round(74 + (75 - 74) * t)})`
          : `rgb(${Math.round(180 + (224 - 180) * t)}, ${Math.round(50 + (57 - 50) * t)}, ${Math.round(45 + (47 - 45) * t)})`;
      } else if (metric === 'foreignNet') {
        const net = row.foreignBuy - row.foreignSell;
        if (net === 0 || maxValues.maxForeign === 0) return '#526B84';
        const t = Math.min(1, Math.abs(net) / maxValues.maxForeign);
        return net > 0
          ? `rgba(22, 176, 75, ${Math.max(0.3, t)})`
          : `rgba(224, 57, 47, ${Math.max(0.3, t)})`;
      } else {
        const val = row.valueMn + row.ptValueMn;
        const t = Math.min(1, val / maxValues.maxLiquidity);
        return `rgba(37, 132, 184, ${Math.max(0.2, t)})`;
      }
    },
    [metric, maxValues]
  );

  const drawTreemap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 600;
    const height = canvas.parentElement?.clientHeight || 400;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const groups = calculateLayout(width, height);
    setPlacedGroups(groups);

    ctx.fillStyle = isDark ? '#111923' : '#F3F6FA';
    ctx.fillRect(0, 0, width, height);

    for (const group of groups) {
      if (group.header.h > 0) {
        ctx.fillStyle = isDark ? 'rgba(43, 57, 72, 0.7)' : 'rgba(220, 228, 237, 0.8)';
        ctx.fillRect(group.header.x, group.header.y, group.header.w, group.header.h);

        ctx.fillStyle = isDark ? '#E2E8F0' : '#163A5F';
        ctx.font = 'bold 10px Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const headerText = group.name.length > 20 ? group.name.substring(0, 18) + '…' : group.name;
        ctx.fillText(headerText, group.header.x + 4, group.header.y + group.header.h / 2);
      }

      for (const item of group.items) {
        const row = rowsBySymbol[item.id];
        if (!row) continue;

        const tileColor = getTileColor(row);
        ctx.fillStyle = tileColor;
        ctx.fillRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);

        ctx.strokeStyle = isDark ? 'rgba(17, 25, 35, 0.4)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(item.rect.x, item.rect.y, item.rect.w, item.rect.h);

        if (item.rect.w >= 26 && item.rect.h >= 18) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = item.rect.w > 48 && item.rect.h > 36 ? 'bold 12px Roboto, sans-serif' : 'bold 10px Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const centerX = item.rect.x + item.rect.w / 2;
          const centerY = item.rect.y + item.rect.h / 2;

          if (item.rect.w >= 40 && item.rect.h >= 32) {
            ctx.fillText(item.id, centerX, centerY - 6);
            ctx.font = '9px Roboto, sans-serif';
            const pctStr = `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(1)}%`;
            ctx.fillText(pctStr, centerX, centerY + 7);
          } else {
            ctx.fillText(item.id, centerX, centerY);
          }
        }
      }
    }
  }, [calculateLayout, rowsBySymbol, getTileColor, isDark]);

  useEffect(() => {
    drawTreemap();
  }, [drawTreemap]);

  useEffect(() => {
    const handleResize = () => drawTreemap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawTreemap]);

  const hitTest = (x: number, y: number): string | null => {
    for (const group of placedGroups) {
      if (
        x < group.rect.x ||
        x > group.rect.x + group.rect.w ||
        y < group.rect.y ||
        y > group.rect.y + group.rect.h
      ) {
        continue;
      }
      for (const item of group.items) {
        if (
          x >= item.rect.x &&
          x <= item.rect.x + item.rect.w &&
          y >= item.rect.y &&
          y <= item.rect.y + item.rect.h
        ) {
          return item.id;
        }
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = hitTest(x, y);
    setHoveredSymbol(hit);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);
    if (hit) onOpen(hit);
  };

  const hoveredRow = hoveredSymbol ? rowsBySymbol[hoveredSymbol] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[300px] cursor-pointer overflow-hidden rounded-lg"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredSymbol(null)}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {hoveredRow && (
        <div
          className="fixed pointer-events-none z-50 bg-[#163A5F] text-white dark:bg-[#182331] dark:border dark:border-[#2B3948] p-2.5 rounded-lg shadow-xl text-xs space-y-1"
          style={{
            left: Math.min(window.innerWidth - 220, tooltipPos.x + 14),
            top: Math.min(window.innerHeight - 100, tooltipPos.y + 14),
            width: 200,
          }}
        >
          <div className="flex justify-between items-center font-bold">
            <span className="text-sm">{hoveredRow.symbol}</span>
            <span className="text-gray-300 font-normal">
              {sectors[hoveredRow.symbol]?.name || 'Khác'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Giá: <b>{fmt(hoveredRow.price / 1000, 2)}</b></span>
            <span
              className={
                hoveredRow.pct >= 0 ? 'text-[#3ECF7F] font-bold' : 'text-[#FF6B62] font-bold'
              }
            >
              {hoveredRow.pct >= 0 ? '+' : ''}
              {fmt(hoveredRow.pct)}%
            </span>
          </div>
          <div className="text-[11px] text-gray-300 pt-1 border-t border-white/10">
            {metric === 'change' && (
              <span>GTGD: {fmt((hoveredRow.valueMn + hoveredRow.ptValueMn) / 1000, 1)} tỷ</span>
            )}
            {metric === 'foreignNet' && (
              <span>Khối ngoại ròng: {fmt(hoveredRow.foreignBuy - hoveredRow.foreignSell, 0)} CP</span>
            )}
            {metric === 'liquidity' && (
              <span>Thanh khoản: {fmt((hoveredRow.valueMn + hoveredRow.ptValueMn) / 1000, 1)} tỷ</span>
            )}
          </div>
          <div className="text-[10px] text-gray-400">Bấm để phân tích AI chuyên sâu</div>
        </div>
      )}
    </div>
  );
};
