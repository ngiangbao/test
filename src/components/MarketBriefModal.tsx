import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Compass,
  ArrowRight
} from 'lucide-react';

interface MarketBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

export const MarketBriefModal: React.FC<MarketBriefModalProps> = ({
  isOpen,
  onClose,
  onSelectStock
}) => {
  const { marketBrief, briefLoading, briefError, runMarketBrief } = useApp();

  useEffect(() => {
    if (isOpen && !marketBrief && !briefLoading) {
      runMarketBrief();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const moodColor = (mood: string = '') => {
    if (mood === 'Tích cực') return 'text-[#0F8A4A] dark:text-[#3ECF7F] bg-emerald-500/10 border-emerald-500/30';
    if (mood === 'Tiêu cực') return 'text-[#C8322B] dark:text-[#FF6B62] bg-rose-500/10 border-rose-500/30';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#151F2B] text-[#111923] dark:text-[#F1F5F9] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50/50 dark:bg-[#182331]/50 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2">
                <span>Bản tin Thị trường AI</span>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                  VN-Index & VN30
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tổng hợp diễn biến, xu hướng dòng tiền và chiến lược phiên tới
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => runMarketBrief()}
              disabled={briefLoading}
              className="flex items-center space-x-1 rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-[#202E3F] transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${briefLoading ? 'animate-spin' : ''}`} />
              <span>Phân tích lại</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202E3F] hover:text-gray-700 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {briefLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-10 w-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
              <p className="font-medium text-sm">Gemini AI đang tổng hợp dữ liệu VN-Index và VN30...</p>
              <p className="text-xs text-gray-400">Đánh giá độ rộng thị trường, dòng tiền theo ngành và tin tức.</p>
            </div>
          )}

          {briefError && !briefLoading && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-center">
              <AlertCircle className="mx-auto h-7 w-7 text-[#C8322B] dark:text-[#FF6B62] mb-2" />
              <p className="text-sm font-semibold text-[#C8322B] dark:text-[#FF6B62]">{briefError}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Bạn có thể thiết lập Gemini API Key trong tab Cài đặt AI.
              </p>
              <button
                onClick={() => runMarketBrief()}
                className="mt-3 rounded-lg bg-[#163A5F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#163A5F]/80"
              >
                Thử lại
              </button>
            </div>
          )}

          {marketBrief && !briefLoading && (
            <>
              {/* Title & Mood */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE4ED] dark:border-[#2B3948] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#163A5F] dark:text-[#82B7E8]">
                    {marketBrief.headline}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Bản tin cập nhật phiên gần nhất</p>
                </div>
                <div
                  className={`inline-flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-bold ${moodColor(
                    marketBrief.mood
                  )}`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Trạng thái: {marketBrief.mood}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#182331] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Tổng quan Diễn biến Thị trường</span>
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {marketBrief.summary}
                </p>
              </div>

              {/* Themes */}
              {marketBrief.themes && marketBrief.themes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Chủ đề & Dòng tiền Nổi bật
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {marketBrief.themes.map((theme, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#182331] p-4 space-y-2"
                      >
                        <div className="font-bold text-xs sm:text-sm text-[#163A5F] dark:text-[#82B7E8]">
                          {theme.theme}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {theme.detail}
                        </p>
                        {theme.tickers && theme.tickers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {theme.tickers.map(ticker => (
                              <button
                                key={ticker}
                                onClick={() => {
                                  onSelectStock(ticker);
                                  onClose();
                                }}
                                className="font-mono rounded bg-white dark:bg-[#202E3F] border border-[#DCE4ED] dark:border-[#2B3948] px-2 py-0.5 text-xs font-bold hover:border-indigo-400 transition"
                              >
                                {ticker}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Watch List */}
              {marketBrief.watch_list && marketBrief.watch_list.length > 0 && (
                <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#182331] p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Điểm Lưu ý cho Phiên Tới
                  </h4>
                  <ul className="list-disc list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                    {marketBrief.watch_list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50/50 dark:bg-[#182331]/50 px-6 py-3 flex justify-between items-center text-xs text-gray-400">
          <span>Phân tích dữ liệu bởi Google Gemini AI</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 dark:bg-[#202E3F] border border-[#DCE4ED] dark:border-[#2B3948] px-4 py-1.5 font-medium hover:bg-gray-200 dark:hover:bg-[#2B3948] transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
