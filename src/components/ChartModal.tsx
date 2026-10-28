import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchBars, fetchFundamentals, fmt } from '../services/marketService';
import { Bar } from '../types/market';
import { StockChart } from './StockChart';
import {
  X,
  Sparkles,
  Star,
  BarChart3
} from 'lucide-react';

interface ChartModalProps {
  symbol: string | null;
  onClose: () => void;
  onOpenAnalysis: (symbol: string) => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  symbol,
  onClose,
  onOpenAnalysis
}) => {
  const {
    currentBoardRows,
    dashSectors,
    watchlist,
    addWatch,
    removeWatch,
    effectiveTheme
  } = useApp();

  const [bars, setBars] = useState<Bar[]>([]);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [resolution, setResolution] = useState<'1D' | '1W' | '1M'>('1D');
  const [loading, setLoading] = useState(false);

  const isDark = effectiveTheme === 'dark';
  const row = currentBoardRows.find(r => r.symbol === symbol);
  const isWatched = symbol ? watchlist.includes(symbol) : false;

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    Promise.all([
      fetchBars(symbol, { days: 365, resolution }),
      fetchFundamentals(symbol)
    ])
      .then(([b, f]) => {
        setBars(b);
        setFundamentals(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol, resolution]);

  if (!symbol) return null;

  const priceColor = (row?.pct ?? 0) > 0 ? 'text-[#0F8A4A] dark:text-[#3ECF7F]' : (row?.pct ?? 0) < 0 ? 'text-[#C8322B] dark:text-[#FF6B62]' : 'text-amber-500';
  const company = fundamentals?.company || {};
  const ratios = fundamentals?.chi_so_ttm_theo_quy || [];
  const latestRatio = ratios.length > 0 ? ratios[ratios.length - 1] : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col rounded-2xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#151F2B] text-[#111923] dark:text-[#F1F5F9] shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50/50 dark:bg-[#182331]/50 px-4 py-3 gap-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (isWatched ? removeWatch(symbol) : addWatch(symbol))}
              className="text-gray-400 hover:text-yellow-400 transition"
              title={isWatched ? 'Xóa khỏi danh mục theo dõi' : 'Thêm vào danh mục theo dõi'}
            >
              <Star className={`h-5 w-5 ${isWatched ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xl font-bold">{symbol}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {company.ten || dashSectors[symbol]?.name || symbol}
                </span>
                <span className="rounded bg-gray-100 dark:bg-[#202E3F] px-2 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                  {company.nganh || 'HOSE'}
                </span>
              </div>
            </div>

            <div className="flex items-baseline space-x-2 pl-4 border-l border-[#DCE4ED] dark:border-[#2B3948]">
              <span className={`font-mono text-2xl font-bold ${priceColor}`}>
                {row ? fmt(row.price, 2) : '–'}
              </span>
              <span className={`font-mono text-sm font-semibold ${priceColor}`}>
                {(row?.pct ?? 0) > 0 ? '+' : ''}{row ? fmt(row.pct, 2) : '0'}%
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Resolution Selector */}
            <div className="flex rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-0.5 text-xs font-mono">
              {(['1D', '1W', '1M'] as const).map(res => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`rounded px-2.5 py-1 transition ${
                    resolution === res
                      ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033] font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>

            <button
              onClick={() => onOpenAnalysis(symbol)}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phân tích AI</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202E3F] hover:text-gray-700 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
          {/* Main Chart Area */}
          <div className="lg:col-span-3 flex flex-col h-full border-r border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#151F2B] overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <StockChart
                bars={bars}
                symbol={symbol}
                isDark={isDark}
              />
            )}
          </div>

          {/* Right Panel: Fundamentals & Trading Data */}
          <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-[#182331]/30 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <span>Chỉ số Cơ bản</span>
            </h4>

            {fundamentals ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-2.5">
                  <div className="text-[11px] text-gray-400">P/E</div>
                  <div className="font-mono text-sm font-bold">{latestRatio.pe ? fmt(latestRatio.pe, 1) : '–'}</div>
                </div>

                <div className="rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-2.5">
                  <div className="text-[11px] text-gray-400">P/B</div>
                  <div className="font-mono text-sm font-bold">{latestRatio.pb ? fmt(latestRatio.pb, 1) : '–'}</div>
                </div>

                <div className="rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-2.5">
                  <div className="text-[11px] text-gray-400">ROE</div>
                  <div className="font-mono text-sm font-bold text-[#0F8A4A] dark:text-[#3ECF7F]">
                    {latestRatio.roe ? `${(latestRatio.roe * 100).toFixed(1)}%` : '–'}
                  </div>
                </div>

                <div className="rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-2.5">
                  <div className="text-[11px] text-gray-400">Vốn hóa</div>
                  <div className="font-mono text-sm font-bold">
                    {company.von_hoa_ty_dong ? `${fmt(company.von_hoa_ty_dong, 0)} Tỷ` : '–'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">Đang nạp chỉ số tài chính...</div>
            )}

            {/* Session Stats */}
            <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-3 space-y-2 text-xs">
              <div className="font-semibold text-[11px] uppercase tracking-wider text-gray-400">Thông tin Phiên</div>
              <div className="flex justify-between py-1 border-b border-[#DCE4ED]/40 dark:border-[#2B3948]/40">
                <span className="text-gray-400">Giá trần / sàn</span>
                <span className="font-mono">
                  <span className="text-purple-400 font-semibold">{row ? fmt(row.ceil, 2) : '–'}</span> /{' '}
                  <span className="text-cyan-400 font-semibold">{row ? fmt(row.floor, 2) : '–'}</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE4ED]/40 dark:border-[#2B3948]/40">
                <span className="text-gray-400">Cao / Thấp</span>
                <span className="font-mono">
                  {row ? fmt(row.high, 2) : '–'} / {row ? fmt(row.low, 2) : '–'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DCE4ED]/40 dark:border-[#2B3948]/40">
                <span className="text-gray-400">Khối lượng khớp</span>
                <span className="font-mono font-semibold">
                  {row ? fmt(row.volume / 1000, 0) : '0'} k
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">NN Mua / Bán</span>
                <span className="font-mono">
                  <span className="text-[#0F8A4A] dark:text-[#3ECF7F]">{row ? fmt(row.foreignBuy / 1000, 0) : '0'}k</span> /{' '}
                  <span className="text-[#C8322B] dark:text-[#FF6B62]">{row ? fmt(row.foreignSell / 1000, 0) : '0'}k</span>
                </span>
              </div>
            </div>

            {/* AI trigger callout */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-center space-y-2">
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
                Báo cáo Đa chiều cho {symbol}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Bao gồm bảng điểm 8 tiêu chí, luận điểm đầu tư cốt lõi, kịch bản Bull/Bear và lịch sự kiện.
              </p>
              <button
                onClick={() => onOpenAnalysis(symbol)}
                className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow"
              >
                Mở Phân tích AI Chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
