import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt } from '../services/marketService';
import {
  TrendingUp,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Search,
  Activity,
  Star,
  Filter,
  Newspaper,
  Settings
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMarketBrief: () => void;
  onSearchSelect: (symbol: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMarketBrief,
  onSearchSelect
}) => {
  const {
    effectiveTheme,
    setThemeMode,
    currentBoardRows,
    currentQuote,
    dashLoading,
    refresh,
    updatedAt
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // VN-Index / VN30 statistics
  const advancers = currentBoardRows.filter(r => r.dir === 1).length;
  const decliners = currentBoardRows.filter(r => r.dir === -1).length;
  const flat = currentBoardRows.filter(r => r.dir === 0).length;
  const totalVolume = currentBoardRows.reduce((acc, r) => acc + (r.volume || 0), 0);
  const totalValueTy = Math.round(currentBoardRows.reduce((acc, r) => acc + (r.valueMn || 0), 0) / 1000);

  const filteredSymbols = searchQuery.trim()
    ? currentBoardRows.filter(r => r.symbol.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: Activity },
    { id: 'watchlist', label: 'Theo dõi', icon: Star },
    { id: 'screener', label: 'Bộ lọc', icon: Filter },
    { id: 'news', label: 'Tin tức', icon: Newspaper },
    { id: 'settings', label: 'Cài đặt AI', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[#DCE4ED] dark:border-[#2B3948] bg-white/95 dark:bg-[#111923]/95 backdrop-blur-md transition-colors duration-200">
      {/* Top Ticker Strip */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#DCE4ED]/60 dark:border-[#2B3948]/60 px-4 py-1.5 text-xs">
        <div className="flex items-center space-x-6 overflow-x-auto py-0.5">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">VN-Index:</span>
            <span className="font-mono font-bold text-[#0F8A4A] dark:text-[#3ECF7F]">
              {currentQuote?.last ? fmt(currentQuote.last, 2) : '1.285,50'}{' '}
              ({currentQuote?.pct ? `${currentQuote.pct >= 0 ? '+' : ''}${fmt(currentQuote.pct, 2)}%` : '+0,65%'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">Thanh khoản:</span>
            <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
              {totalValueTy > 0 ? `${fmt(totalValueTy, 0)} tỷ` : '18.450 tỷ'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">Độ rộng:</span>
            <span className="font-mono text-[#0F8A4A] dark:text-[#3ECF7F]">{advancers} tăng</span>
            <span className="text-gray-400">/</span>
            <span className="font-mono text-yellow-500">{flat} tc</span>
            <span className="text-gray-400">/</span>
            <span className="font-mono text-[#C8322B] dark:text-[#FF6B62]">{decliners} giảm</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
          <span className="hidden md:inline font-mono">
            {updatedAt ? `Cập nhật: ${updatedAt.toLocaleTimeString('vi-VN')}` : 'Đang đồng bộ...'}
          </span>
          <button
            onClick={() => refresh()}
            disabled={dashLoading}
            className="flex items-center space-x-1 rounded px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-[#182331] transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-3 w-3 ${dashLoading ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('overview')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#163A5F] text-white shadow-md shadow-[#163A5F]/20 dark:bg-[#1E4E7A]">
              <TrendingUp className="h-5 w-5 text-[#3ECF7F]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-gray-900 dark:text-white text-base">
                  VN Stock Insight
                </span>
                <span className="rounded bg-[#163A5F]/10 dark:bg-[#82B7E8]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#163A5F] dark:text-[#82B7E8] uppercase">
                  AI Pro
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Phân tích thị trường chứng khoán Việt Nam
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#163A5F] text-white shadow-sm dark:bg-[#82B7E8] dark:text-[#102033]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182331]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Mã CK (vd: FPT, VCB)..."
                className="h-8 w-36 sm:w-44 rounded-md border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] pl-8 pr-3 text-xs text-gray-800 dark:text-gray-200 focus:w-56 focus:outline-none transition-all"
              />
            </div>

            {showSearchDropdown && filteredSymbols.length > 0 && (
              <div
                className="absolute right-0 mt-1 w-64 rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-1.5 shadow-xl z-50"
                onMouseLeave={() => setShowSearchDropdown(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Kết quả ({filteredSymbols.length})
                </div>
                {filteredSymbols.map(item => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      onSearchSelect(item.symbol);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-[#202E3F] transition"
                  >
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {item.symbol}
                    </span>
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold mr-2">{fmt(item.price, 2)}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          item.pct >= 0 ? 'text-[#0F8A4A] dark:text-[#3ECF7F]' : 'text-[#C8322B] dark:text-[#FF6B62]'
                        }`}
                      >
                        {item.pct >= 0 ? '+' : ''}{fmt(item.pct, 2)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenMarketBrief}
            className="flex items-center space-x-1.5 rounded-md bg-gradient-to-r from-blue-700 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-blue-600 hover:to-indigo-500 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Bản tin AI</span>
          </button>

          <button
            onClick={() => setThemeMode(effectiveTheme === 'dark' ? 'light' : 'dark')}
            className="rounded-md border border-[#DCE4ED] dark:border-[#2B3948] p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#182331] dark:text-gray-300 transition"
            title="Đổi giao diện Sáng / Tối"
          >
            {effectiveTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-[#DCE4ED]/60 dark:border-[#2B3948]/60 px-2 py-1 justify-around bg-gray-50 dark:bg-[#151F2B]">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium transition ${
                isActive ? 'text-[#163A5F] dark:text-[#82B7E8] font-bold' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
