import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkline } from './Sparkline';
import { fmt } from '../services/marketService';
import {
  Star,
  Trash2,
  Sparkles,
  BarChart2,
  TrendingUp,
  Plus
} from 'lucide-react';

interface WatchlistTabProps {
  onOpenChart: (symbol: string) => void;
  onOpenAnalysis: (symbol: string) => void;
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({
  onOpenChart,
  onOpenAnalysis
}) => {
  const {
    watchlist,
    removeWatch,
    addWatch,
    stocks,
    currentBoardRows,
    dashSectors,
    effectiveTheme
  } = useApp();

  const isDark = effectiveTheme === 'dark';

  const addDefaults = () => {
    ['FPT', 'HPG', 'MWG', 'VCB', 'TCB'].forEach(s => addWatch(s));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span>Danh mục Theo dõi Cá nhân</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Theo dõi sát sao biến động giá, xu hướng ngắn hạn và luận điểm đầu tư các mã cổ phiếu mục tiêu
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          Đang theo dõi: <span className="font-bold text-gray-900 dark:text-white">{watchlist.length}</span> mã
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-[#202E3F] text-yellow-400 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chưa có mã nào trong danh mục theo dõi</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4">
            Nhấn vào biểu tượng ngôi sao bên cạnh bất kỳ cổ phiếu nào trong Bảng giá hoặc thêm danh mục gợi ý bên dưới.
          </p>
          <button
            onClick={addDefaults}
            className="flex items-center space-x-2 rounded-lg bg-[#163A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163A5F]/80 transition dark:bg-[#82B7E8] dark:text-[#102033]"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhóm Bluechip (FPT, HPG, MWG, VCB, TCB)</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="py-3 px-4">Mã CK</th>
                  <th className="py-3 px-4">Tên Doanh nghiệp</th>
                  <th className="py-3 px-4">Ngành</th>
                  <th className="py-3 px-4 text-center">Biểu đồ 30 phiên</th>
                  <th className="py-3 px-4 text-right">Giá Khớp</th>
                  <th className="py-3 px-4 text-right">Biến động 1D</th>
                  <th className="py-3 px-4 text-right">Biến động 1M</th>
                  <th className="py-3 px-4 text-center">Điểm Kỹ thuật</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4ED]/60 dark:divide-[#2B3948]/60">
                {watchlist.map(symbol => {
                  const snap = stocks[symbol];
                  const boardRow = currentBoardRows.find(r => r.symbol === symbol);
                  const sector = dashSectors[symbol]?.name || 'HOSE';
                  const price = boardRow?.price ?? snap?.close ?? 0;
                  const pct1d = boardRow?.pct ?? snap?.data?.change_1d ?? 0;
                  const pct1m = snap?.data?.change_1m ?? 0;
                  const techScore = snap?.techScore ?? 3;
                  const spark = snap?.spark || [];

                  const priceColor =
                    pct1d > 0
                      ? 'text-[#0F8A4A] dark:text-[#3ECF7F]'
                      : pct1d < 0
                      ? 'text-[#C8322B] dark:text-[#FF6B62]'
                      : 'text-amber-500';

                  return (
                    <tr
                      key={symbol}
                      onClick={() => onOpenChart(symbol)}
                      className="hover:bg-gray-50 dark:hover:bg-[#202E3F]/50 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white text-sm">
                        {symbol}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                        {dashSectors[symbol]?.name || symbol}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-gray-100 dark:bg-[#202E3F] px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {sector}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center w-28 mx-auto">
                          {spark.length > 1 ? (
                            <Sparkline
                              values={spark}
                              height={32}
                              isDark={isDark}
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">Đang nạp...</span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono text-sm font-bold ${priceColor}`}>
                        {fmt(price, 2)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-semibold ${priceColor}`}>
                        {pct1d > 0 ? '+' : ''}{fmt(pct1d, 2)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500 dark:text-gray-400">
                        {pct1m > 0 ? '+' : ''}{fmt(pct1m, 1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                          {techScore}/5
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-center"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onOpenChart(symbol)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202E3F] hover:text-gray-800 dark:hover:text-white transition"
                            title="Mở biểu đồ"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenAnalysis(symbol)}
                            className="flex items-center space-x-1 rounded bg-indigo-600/10 px-2 py-1 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-600/20 transition font-medium"
                            title="Báo cáo phân tích AI 8 tiêu chí"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-[11px]">AI Report</span>
                          </button>
                          <button
                            onClick={() => removeWatch(symbol)}
                            className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                            title="Xóa khỏi danh mục"
                          >
                            <Trash2 className="h-4 w-4" />
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
