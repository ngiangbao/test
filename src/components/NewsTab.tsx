import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { timeLocal } from '../services/marketService';
import {
  Newspaper,
  ExternalLink,
  Search,
  Tag
} from 'lucide-react';

interface NewsTabProps {
  onSelectStock: (symbol: string) => void;
}

export const NewsTab: React.FC<NewsTabProps> = ({ onSelectStock }) => {
  const { news, loading } = useApp();
  const [selectedTicker, setSelectedTicker] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const allTickers = Array.from(
    new Set(news.flatMap(n => n.tickers || []))
  );

  const filteredNews = news.filter(item => {
    if (selectedTicker !== 'ALL' && (!item.tickers || !item.tickers.includes(selectedTicker))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Newspaper className="h-5 w-5 text-[#163A5F] dark:text-[#82B7E8]" />
            <span>Tin tức & Diễn biến Doanh nghiệp</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cập nhật liên tục dòng tin vĩ mô, báo cáo tài chính và công bố thông tin các doanh nghiệp niêm yết
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung..."
            className="h-8 w-56 rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] pl-8 pr-3 text-xs text-gray-800 dark:text-gray-200 focus:w-72 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Ticker Filter Tags */}
      {allTickers.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-gray-400 flex items-center space-x-1 flex-shrink-0">
            <Tag className="h-3 w-3" />
            <span>Mã CP:</span>
          </span>
          <button
            onClick={() => setSelectedTicker('ALL')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition flex-shrink-0 ${
              selectedTicker === 'ALL'
                ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033]'
                : 'border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {allTickers.map(ticker => (
            <button
              key={ticker}
              onClick={() => setSelectedTicker(ticker)}
              className={`rounded-full px-3 py-1 text-xs font-mono font-medium transition flex-shrink-0 ${
                selectedTicker === ticker
                  ? 'bg-[#163A5F] text-white dark:bg-[#82B7E8] dark:text-[#102033]'
                  : 'border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      )}

      {/* News List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-10 text-center text-xs text-gray-400">
          Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-5 hover:border-indigo-400 transition shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#163A5F] dark:text-[#82B7E8]">{item.source}</span>
                    <span>•</span>
                    <span>{timeLocal(item.published)}</span>
                  </div>
                  {item.tickers && item.tickers.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {item.tickers.map(t => (
                        <button
                          key={t}
                          onClick={() => onSelectStock(t)}
                          className="font-mono rounded bg-gray-100 dark:bg-[#202E3F] px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-600 hover:text-white transition"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition">
                  {item.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DCE4ED]/60 dark:border-[#2B3948]/60 flex items-center justify-between">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-medium text-[#163A5F] dark:text-[#82B7E8] hover:underline"
                >
                  <span>Xem nguồn gốc</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                {item.tickers && item.tickers[0] && (
                  <button
                    onClick={() => onSelectStock(item.tickers[0])}
                    className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                  >
                    <span>Mở biểu đồ {item.tickers[0]}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
