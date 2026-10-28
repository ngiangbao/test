import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { WatchlistTab } from './components/WatchlistTab';
import { ScreenerTab } from './components/ScreenerTab';
import { NewsTab } from './components/NewsTab';
import { SettingsTab } from './components/SettingsTab';
import { ChartModal } from './components/ChartModal';
import { AnalysisModal } from './components/AnalysisModal';
import { MarketBriefModal } from './components/MarketBriefModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [analysisSymbol, setAnalysisSymbol] = useState<string | null>(null);
  const [isMarketBriefOpen, setIsMarketBriefOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F6FA] dark:bg-[#111923] text-[#111923] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMarketBrief={() => setIsMarketBriefOpen(true)}
        onSearchSelect={symbol => setChartSymbol(symbol)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewTab
            onOpenChart={sym => setChartSymbol(sym)}
            onOpenAnalysis={sym => setAnalysisSymbol(sym)}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistTab
            onOpenChart={sym => setChartSymbol(sym)}
            onOpenAnalysis={sym => setAnalysisSymbol(sym)}
          />
        )}

        {activeTab === 'screener' && (
          <ScreenerTab
            onOpenChart={sym => setChartSymbol(sym)}
            onOpenAnalysis={sym => setAnalysisSymbol(sym)}
          />
        )}

        {activeTab === 'news' && (
          <NewsTab onSelectStock={sym => setChartSymbol(sym)} />
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Popups & Modals */}
      <ChartModal
        symbol={chartSymbol}
        onClose={() => setChartSymbol(null)}
        onOpenAnalysis={sym => {
          setChartSymbol(null);
          setAnalysisSymbol(sym);
        }}
      />

      <AnalysisModal
        symbol={analysisSymbol}
        onClose={() => setAnalysisSymbol(null)}
      />

      <MarketBriefModal
        isOpen={isMarketBriefOpen}
        onClose={() => setIsMarketBriefOpen(false)}
        onSelectStock={sym => setChartSymbol(sym)}
      />

      {/* Footer */}
      <footer className="border-t border-[#DCE4ED] dark:border-[#2B3948] bg-white/70 dark:bg-[#151F2B]/70 py-4 px-6 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-900 dark:text-white">VN Stock Insight</span>
            <span>•</span>
            <span>Bản quyền © 2026</span>
          </div>
          <div className="text-[11px] text-center sm:text-right">
            Dữ liệu tham khảo thị trường chứng khoán Việt Nam. Không cấu thành lời khuyên đầu tư tài chính.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
