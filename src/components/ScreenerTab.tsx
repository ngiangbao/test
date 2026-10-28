import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { fetchFundamentals, fmt } from '../services/marketService';
import {
  Filter,
  Download,
  RotateCcw,
  Sparkles,
  BarChart2,
  SlidersHorizontal,
  Star
} from 'lucide-react';

interface ScreenerTabProps {
  onOpenChart: (symbol: string) => void;
  onOpenAnalysis: (symbol: string) => void;
}

interface FilterState {
  sector: string;
  maxPe: number;
  maxPb: number;
  minRoe: number;
  minVolThousand: number;
  priceTrend: 'ALL' | 'UP' | 'DOWN';
}

const initialFilter: FilterState = {
  sector: 'ALL',
  maxPe: 35,
  maxPb: 5,
  minRoe: 10,
  minVolThousand: 200,
  priceTrend: 'ALL'
};

export const ScreenerTab: React.FC<ScreenerTabProps> = ({
  onOpenChart,
  onOpenAnalysis
}) => {
  const { currentBoardRows, dashSectors, watchlist, addWatch, removeWatch } = useApp();
  const [filters, setFilters] = useState<FilterState>(initialFilter);
  const [fundamentalsMap, setFundamentalsMap] = useState<Record<string, any>>({});
  const [loadingFunds, setLoadingFunds] = useState(false);

  useEffect(() => {
    if (currentBoardRows.length === 0) return;
    setLoadingFunds(true);
    Promise.all(currentBoardRows.map(r => fetchFundamentals(r.symbol)))
      .then(results => {
        const map: Record<string, any> = {};
        results.forEach(f => {
          if (f?.company?.ma) {
            map[f.company.ma] = f;
          }
        });
        setFundamentalsMap(map);
      })
      .catch(console.error)
      .finally(() => setLoadingFunds(false));
  }, [currentBoardRows]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const r of currentBoardRows) {
      const s = dashSectors[r.symbol]?.name;
      if (s) set.add(s);
    }
    return ['ALL', ...Array.from(set)];
  }, [currentBoardRows, dashSectors]);

  const screenedRows = useMemo(() => {
    return currentBoardRows.filter(row => {
      const fund = fundamentalsMap[row.symbol];
      const ratios = fund?.chi_so_ttm_theo_quy || [];
      const latestRatio = ratios.length > 0 ? ratios[ratios.length - 1] : null;

      // Sector filter
      if (filters.sector !== 'ALL') {
        const sec = dashSectors[row.symbol]?.name;
        if (sec !== filters.sector) return false;
      }

      // Trend filter
      if (filters.priceTrend === 'UP' && row.pct <= 0) return false;
      if (filters.priceTrend === 'DOWN' && row.pct >= 0) return false;

      // Volume
      if (row.volume / 1000 < filters.minVolThousand) return false;

      // Financials
      if (latestRatio) {
        if (latestRatio.pe && latestRatio.pe > filters.maxPe) return false;
        if (latestRatio.pb && latestRatio.pb > filters.maxPb) return false;
        if (latestRatio.roe && latestRatio.roe * 100 < filters.minRoe) return false;
      }

      return true;
    });
  }, [currentBoardRows, dashSectors, fundamentalsMap, filters]);

  const exportCsv = () => {
    const headers = ['Symbol', 'Sector', 'Price', 'Pct_1D', 'PE', 'PB', 'ROE_Pct', 'Volume'];
    const rows = screenedRows.map(r => {
      const f = fundamentalsMap[r.symbol];
      const ratios = f?.chi_so_ttm_theo_quy || [];
      const latest = ratios.length > 0 ? ratios[ratios.length - 1] : {};
      return [
        r.symbol,
        `"${dashSectors[r.symbol]?.name || 'HOSE'}"`,
        r.price,
        r.pct,
        latest.pe ?? '',
        latest.pb ?? '',
        latest.roe ? (latest.roe * 100).toFixed(1) : '',
        r.volume
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VN_Stock_Screener_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Filter className="h-5 w-5 text-[#163A5F] dark:text-[#82B7E8]" />
            <span>Bộ lọc Cổ phiếu Đa Tiêu chí</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Sàng lọc cổ phiếu theo định giá P/E, P/B, hiệu quả sinh lời ROE, nhóm ngành và thanh khoản
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFilters(initialFilter)}
            className="flex items-center space-x-1 rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>
          <button
            onClick={exportCsv}
            disabled={screenedRows.length === 0}
            className="flex items-center space-x-1.5 rounded-lg bg-[#163A5F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163A5F]/80 transition disabled:opacity-50 dark:bg-[#82B7E8] dark:text-[#102033]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Card */}
      <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-4 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-[#DCE4ED] dark:border-[#2B3948] text-xs font-bold uppercase tracking-wider text-gray-400">
          <SlidersHorizontal className="h-4 w-4 text-[#163A5F] dark:text-[#82B7E8]" />
          <span>Thông số Sàng lọc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <label className="block text-gray-400 font-medium mb-1">Nhóm ngành</label>
            <select
              value={filters.sector}
              onChange={e => setFilters({ ...filters, sector: e.target.value })}
              className="w-full rounded-md border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2 text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              {sectors.map(s => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'Tất cả các ngành' : s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-medium mb-1">Xu hướng phiên</label>
            <select
              value={filters.priceTrend}
              onChange={e => setFilters({ ...filters, priceTrend: e.target.value as any })}
              className="w-full rounded-md border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2 text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="ALL">Tất cả xu hướng</option>
              <option value="UP">Tăng giá (Xanh)</option>
              <option value="DOWN">Giảm giá (Đỏ)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-gray-400 font-medium mb-1">
              <span>P/E tối đa:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{filters.maxPe}x</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={filters.maxPe}
              onChange={e => setFilters({ ...filters, maxPe: Number(e.target.value) })}
              className="w-full cursor-pointer accent-[#163A5F] dark:accent-[#82B7E8]"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-400 font-medium mb-1">
              <span>P/B tối đa:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{filters.maxPb}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={filters.maxPb}
              onChange={e => setFilters({ ...filters, maxPb: Number(e.target.value) })}
              className="w-full cursor-pointer accent-[#163A5F] dark:accent-[#82B7E8]"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-400 font-medium mb-1">
              <span>ROE tối thiểu:</span>
              <span className="font-mono font-bold text-[#0F8A4A] dark:text-[#3ECF7F]">{filters.minRoe}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={2}
              value={filters.minRoe}
              onChange={e => setFilters({ ...filters, minRoe: Number(e.target.value) })}
              className="w-full cursor-pointer accent-[#163A5F] dark:accent-[#82B7E8]"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-400 font-medium mb-1">
              <span>Khối lượng tối thiểu:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{filters.minVolThousand}k</span>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={filters.minVolThousand}
              onChange={e => setFilters({ ...filters, minVolThousand: Number(e.target.value) })}
              className="w-full cursor-pointer accent-[#163A5F] dark:accent-[#82B7E8]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          Tìm thấy <span className="font-bold text-gray-900 dark:text-white font-mono text-sm">{screenedRows.length}</span> mã thỏa mãn điều kiện
        </div>
        {loadingFunds && <div>Đang nạp chỉ số tài chính...</div>}
      </div>

      <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] text-gray-500 dark:text-gray-400 font-semibold">
                <th className="py-2.5 px-3">Theo dõi</th>
                <th className="py-2.5 px-3">Mã CK</th>
                <th className="py-2.5 px-3">Ngành</th>
                <th className="py-2.5 px-3 text-right">Giá Khớp</th>
                <th className="py-2.5 px-3 text-right">Thay đổi 1D</th>
                <th className="py-2.5 px-3 text-right">P/E</th>
                <th className="py-2.5 px-3 text-right">P/B</th>
                <th className="py-2.5 px-3 text-right">ROE</th>
                <th className="py-2.5 px-3 text-right">Khối lượng</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4ED]/60 dark:divide-[#2B3948]/60">
              {screenedRows.map(row => {
                const f = fundamentalsMap[row.symbol];
                const ratios = f?.chi_so_ttm_theo_quy || [];
                const latest = ratios.length > 0 ? ratios[ratios.length - 1] : {};
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
                    onClick={() => onOpenChart(row.symbol)}
                    className="hover:bg-gray-50 dark:hover:bg-[#202E3F]/50 transition cursor-pointer"
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
                        {dashSectors[row.symbol]?.name || 'HOSE'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${priceColor}`}>
                      {fmt(row.price, 2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${priceColor}`}>
                      {row.pct > 0 ? '+' : ''}{fmt(row.pct, 2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {latest.pe ? `${fmt(latest.pe, 1)}x` : '–'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {latest.pb ? `${fmt(latest.pb, 1)}x` : '–'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#0F8A4A] dark:text-[#3ECF7F] font-semibold">
                      {latest.roe ? `${(latest.roe * 100).toFixed(1)}%` : '–'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500">
                      {fmt(row.volume / 1000, 0)} k
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
                          title="Phân tích AI"
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
    </div>
  );
};
