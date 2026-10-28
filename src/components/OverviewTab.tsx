import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HeatMapCanvas } from './HeatMapCanvas';
import { BoardRow, HeatMetric } from '../types/market';
import { fmt } from '../services/marketService';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Layers,
  ArrowUpDown,
  Star,
  Sparkles
} from 'lucide-react';

interface OverviewTabProps {
  onOpenChart: (symbol: string) => void;
  onOpenAnalysis: (symbol: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onOpenChart,
  onOpenAnalysis
}) => {
  const {
    currentBoardRows,
    dashSectors,
    dashHeatMetric,
    setDashHeatMetric,
    watchlist,
    addWatch,
    removeWatch,
    effectiveTheme
  } = useApp();

  const [viewMode, setViewMode] = useState<'treemap' | 'table'>('treemap');
  const [sortBy, setSortBy] = useState<keyof BoardRow>('valueMn');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');

  // Top gainers, losers, liquidity
  const topGainers = useMemo(() => {
    return [...currentBoardRows].sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, [currentBoardRows]);

  const topLosers = useMemo(() => {
    return [...currentBoardRows].sort((a, b) => a.pct - b.pct).slice(0, 5);
  }, [currentBoardRows]);

  const mostActive = useMemo(() => {
    return [...currentBoardRows].sort((a, b) => (b.valueMn + b.ptValueMn) - (a.valueMn + a.ptValueMn)).slice(0, 5);
  }, [currentBoardRows]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const r of currentBoardRows) {
      const s = dashSectors[r.symbol]?.name;
      if (s) set.add(s);
    }
    return ['ALL', ...Array.from(set)];
  }, [currentBoardRows, dashSectors]);

  const filteredRows = useMemo(() => {
    return currentBoardRows
      .filter(r => {
        if (sectorFilter === 'ALL') return true;
        const sec = dashSectors[r.symbol]?.name;
        return sec === sectorFilter;
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      });
  }, [currentBoardRows, dashSectors, sectorFilter, sortBy, sortAsc]);

  const handleSort = (key: keyof BoardRow) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Gainers */}
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DCE4ED] dark:border-[#2B3948]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F8A4A] dark:text-[#3ECF7F] flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Tăng mạnh nhất (Top Gainers)</span>
            </h3>
          </div>
          <div className="space-y-2">
            {topGainers.map(item => (
              <div
                key={item.symbol}
                onClick={() => onOpenChart(item.symbol)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202E3F] cursor-pointer transition text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{item.symbol}</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                    {dashSectors[item.symbol]?.name || 'HOSE'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <span className="font-mono font-semibold">{fmt(item.price, 2)}</span>
                  <span className="font-mono font-semibold text-[#0F8A4A] dark:text-[#3ECF7F]">
                    +{fmt(item.pct, 2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DCE4ED] dark:border-[#2B3948]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C8322B] dark:text-[#FF6B62] flex items-center space-x-1.5">
              <TrendingDown className="h-4 w-4" />
              <span>Giảm nhiều nhất (Top Losers)</span>
            </h3>
          </div>
          <div className="space-y-2">
            {topLosers.map(item => (
              <div
                key={item.symbol}
                onClick={() => onOpenChart(item.symbol)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202E3F] cursor-pointer transition text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{item.symbol}</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                    {dashSectors[item.symbol]?.name || 'HOSE'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <span className="font-mono font-semibold">{fmt(item.price, 2)}</span>
                  <span className="font-mono font-semibold text-[#C8322B] dark:text-[#FF6B62]">
                    {fmt(item.pct, 2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active */}
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DCE4ED] dark:border-[#2B3948]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#163A5F] dark:text-[#82B7E8] flex items-center space-x-1.5">
              <Activity className="h-4 w-4" />
              <span>Thanh khoản dẫn đầu (Top Value)</span>
            </h3>
          </div>
          <div className="space-y-2">
            {mostActive.map(item => (
              <div
                key={item.symbol}
                onClick={() => onOpenChart(item.symbol)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202E3F] cursor-pointer transition text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{item.symbol}</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[110px]">
                    {dashSectors[item.symbol]?.name || 'HOSE'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <span className="font-mono text-gray-500">
                    {fmt((item.valueMn + item.ptValueMn) / 1000, 0)} Tỷ
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      item.pct >= 0 ? 'text-[#0F8A4A] dark:text-[#3ECF7F]' : 'text-[#C8322B] dark:text-[#FF6B62]'
                    }`}
                  >
                    {item.pct >= 0 ? '+' : ''}{fmt(item.pct, 2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Section Header with Heatmap / Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>Bản đồ Thị trường & Bảng giá VN30</span>
          </h2>
          <span className="rounded bg-gray-100 dark:bg-[#202E3F] px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
            {filteredRows.length} mã
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Heat metric selector */}
          {viewMode === 'treemap' && (
            <div className="flex rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-0.5 text-xs">
              <button
                onClick={() => setDashHeatMetric('change')}
                className={`px-2 py-1 rounded transition ${
                  dashHeatMetric === 'change'
                    ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033] font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                % Biến động
              </button>
              <button
                onClick={() => setDashHeatMetric('liquidity')}
                className={`px-2 py-1 rounded transition ${
                  dashHeatMetric === 'liquidity'
                    ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033] font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Thanh khoản
              </button>
              <button
                onClick={() => setDashHeatMetric('foreignNet')}
                className={`px-2 py-1 rounded transition ${
                  dashHeatMetric === 'foreignNet'
                    ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033] font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Khối ngoại
              </button>
            </div>
          )}

          {/* Sector filter */}
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="h-8 rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] px-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            {sectors.map(s => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'Tất cả các ngành' : s}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('treemap')}
              className={`flex items-center space-x-1.5 rounded px-2.5 py-1 transition ${
                viewMode === 'treemap'
                  ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Bản đồ Nhiệt</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 rounded px-2.5 py-1 transition ${
                viewMode === 'table'
                  ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Bảng số liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap or Table */}
      {viewMode === 'treemap' ? (
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-4 shadow-sm h-[520px]">
          <HeatMapCanvas
            rows={filteredRows}
            sectors={dashSectors}
            metric={dashHeatMetric}
            onOpen={symbol => onOpenChart(symbol)}
            isDark={effectiveTheme === 'dark'}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="py-2.5 px-3">Theo dõi</th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('symbol')}>
                    <div className="flex items-center space-x-1">
                      <span>Mã CK</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Ngành</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('price')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Giá khớp</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('pct')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>+/- %</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('volume')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Khối lượng</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('valueMn')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Giá trị (Tỷ)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Khối ngoại (Mua - Bán)</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4ED]/60 dark:divide-[#2B3948]/60">
                {filteredRows.map(row => {
                  const isWatched = watchlist.includes(row.symbol);
                  const priceColor =
                    row.pct > 0
                      ? 'text-[#0F8A4A] dark:text-[#3ECF7F] font-semibold'
                      : row.pct < 0
                      ? 'text-[#C8322B] dark:text-[#FF6B62] font-semibold'
                      : 'text-amber-500';

                  return (
                    <tr
                      key={row.symbol}
                      className="hover:bg-gray-50 dark:hover:bg-[#202E3F]/50 transition cursor-pointer"
                      onClick={() => onOpenChart(row.symbol)}
                    >
                      <td
                        className="py-2.5 px-3"
                        onClick={e => {
                          e.stopPropagation();
                          isWatched ? removeWatch(row.symbol) : addWatch(row.symbol);
                        }}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            isWatched ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white">
                        {row.symbol}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-gray-100 dark:bg-[#202E3F] px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {dashSectors[row.symbol]?.name || 'Khác'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono ${priceColor}`}>
                        {fmt(row.price, 2)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono ${priceColor}`}>
                        {row.pct > 0 ? '+' : ''}{fmt(row.pct, 2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {fmt(row.volume / 1000, 0)} k
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {fmt((row.valueMn + row.ptValueMn) / 1000, 1)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-500">
                        {fmt((row.foreignBuy - row.foreignSell) / 1000, 0)} k
                      </td>
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenChart(row.symbol)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202E3F] hover:text-gray-800 dark:hover:text-white transition"
                            title="Mở biểu đồ"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenAnalysis(row.symbol)}
                            className="rounded p-1 text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="Phân tích AI 8 tiêu chí"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
