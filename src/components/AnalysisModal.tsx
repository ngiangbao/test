import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StockChart } from './StockChart';
import { fmt, timeVN } from '../services/marketService';
import { X, RefreshCw, CheckCircle2, AlertCircle, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisModalProps {
  symbol: string | null;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ symbol, onClose }) => {
  const {
    analyzeStock,
    analysisForToday,
    analyses,
    stocks,
    watchlist,
    addWatch,
    effectiveTheme,
  } = useApp();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = effectiveTheme === 'dark';

  const currentAnalysis = symbol ? analyses[symbol] : null;
  const isCachedToday = symbol ? analysisForToday(symbol) !== null : false;
  const isWatching = symbol ? watchlist.includes(symbol) : false;

  const runAnalysis = async (force = false) => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      await analyzeStock(symbol, force);
    } catch (e: any) {
      setError(e.message || 'Lỗi khi phân tích cổ phiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol && !analysisForToday(symbol)) {
      runAnalysis(false);
    }
  }, [symbol]);

  if (!symbol) return null;

  const stockSnap = stocks[symbol];
  const report = currentAnalysis?.result;
  const inputs = currentAnalysis?.inputs;
  const technicals = inputs?.technicals || stockSnap?.data || {};
  const fundamentals = inputs?.fundamentals || {};
  const company = fundamentals?.company || {};
  const ratios = fundamentals?.chi_so_ttm_theo_quy || [];
  const latestRatio = ratios.length > 0 ? ratios[ratios.length - 1] : {};

  const scorecard = report?.scorecard || [];
  const avgScore =
    scorecard.length > 0
      ? (scorecard.reduce((s, item) => s + item.score, 0) / scorecard.length).toFixed(1)
      : null;

  const stanceColor = (stance: string) => {
    switch (stance) {
      case 'Tích cực':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'Tiêu cực':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      default:
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#151F2B] text-[#111923] dark:text-[#F1F5F9] rounded-2xl border border-[#DCE4ED] dark:border-[#2B3948] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50/50 dark:bg-[#182331]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#163A5F] text-white rounded-lg dark:bg-[#82B7E8] dark:text-[#102033]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{symbol}</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {[company.ten, company.nganh].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Phân tích chuyên sâu bởi AI
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isWatching && (
              <button
                onClick={() => addWatch(symbol)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#202E3F] dark:hover:bg-[#2B3948] transition-colors"
              >
                + Theo dõi
              </button>
            )}
            <button
              onClick={() => runAnalysis(true)}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202E3F] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Phân tích lại"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202E3F] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isCachedToday && !loading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-[#163A5F]/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} />
              <span>Kết quả hôm nay đã lưu trên máy. Bấm nút làm mới ở góc phải nếu bạn muốn phân tích lại.</span>
            </div>
          )}

          {stockSnap && stockSnap.bars && stockSnap.bars.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-[#DCE4ED] dark:border-[#2B3948]">
              <StockChart
                symbol={symbol}
                bars={stockSnap.bars}
                height={260}
                isDark={isDark}
              />
            </div>
          )}

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#163A5F] dark:border-[#82B7E8] border-t-transparent rounded-full animate-spin" />
              <p className="font-medium text-sm">Đang thu thập dữ liệu và phân tích mã {symbol}…</p>
              <p className="text-xs text-gray-400">Thường mất 20–45 giây với dữ liệu kỹ thuật, báo cáo tài chính và tin tức.</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Không thể hoàn tất phân tích</p>
                <p className="text-xs mt-1">{error}</p>
                <button
                  onClick={() => runAnalysis(true)}
                  className="mt-3 px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black">
                        {fmt(technicals.close)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          (technicals.change_1d ?? 0) >= 0
                            ? 'text-[#0F8A4A] dark:text-[#3ECF7F]'
                            : 'text-[#C8322B] dark:text-[#FF6B62]'
                        }`}
                      >
                        {(technicals.change_1d ?? 0) >= 0 ? '+' : ''}
                        {fmt(technicals.change_1d)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Giá đóng cửa phiên gần nhất</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${stanceColor(
                          report.stance
                        )}`}
                      >
                        {report.stance}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Độ tin cậy: {report.confidence}
                      </div>
                    </div>
                    {avgScore && (
                      <div className="text-right pl-3 border-l border-gray-200 dark:border-gray-700">
                        <div className="text-xl font-black text-[#163A5F] dark:text-[#82B7E8]">
                          {avgScore}/5
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Điểm AI
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-[#DCE4ED] dark:border-[#2B3948] text-xs">
                  <div>
                    <div className="text-gray-400">P/E</div>
                    <div className="font-bold">{fmt(latestRatio.pe, 1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">P/B</div>
                    <div className="font-bold">{fmt(latestRatio.pb, 1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">ROE</div>
                    <div className="font-bold">
                      {latestRatio.roe ? `${(latestRatio.roe * 100).toFixed(1)}%` : '–'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Vốn hóa</div>
                    <div className="font-bold">
                      {company.von_hoa_ty_dong ? `${fmt(company.von_hoa_ty_dong, 0)} tỷ` : '–'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">1 năm</div>
                    <div className="font-bold">
                      {(technicals.change_1y ?? 0) >= 0 ? '+' : ''}
                      {fmt(technicals.change_1y)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">RSI (14)</div>
                    <div className="font-bold">{fmt(technicals.rsi14, 1)}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-bold text-base text-[#163A5F] dark:text-[#82B7E8]">
                    {report.headline}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {report.summary}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Bảng chấm điểm 8 tiêu chí
                </h4>
                <div className="space-y-2.5">
                  {scorecard.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
                      <span className="w-44 font-semibold shrink-0">{item.dimension}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <div
                            key={val}
                            className={`w-5 h-2 rounded-full ${
                              val <= item.score
                                ? item.score >= 4
                                  ? 'bg-emerald-500'
                                  : item.score === 3
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                        <span className="ml-1 font-bold">{item.score}/5</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-[11px] flex-1">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Luận điểm đầu tư
                  </h4>
                  <p className="text-xs font-semibold text-[#163A5F] dark:text-[#82B7E8]">
                    {report.thesis?.statement}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Trụ cột hỗ trợ:</span>
                    <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      {report.thesis?.pillars?.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Luận điểm sai nếu:</span>
                    <ul className="list-disc list-inside text-xs space-y-1 text-rose-500">
                      {report.thesis?.invalidation?.map((inv, idx) => (
                        <li key={idx}>{inv}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Kết quả kinh doanh
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {report.earnings?.summary}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Điểm nổi bật:</span>
                    <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      {report.earnings?.highlights?.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Định giá tương đối
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {report.valuation}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Vị thế cạnh tranh
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {report.competition}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Góc nhìn kỹ thuật
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {report.technical?.summary}
                </p>
                <div className="pt-1 text-xs">
                  <span className="font-bold text-[#163A5F] dark:text-[#82B7E8]">Vùng giá then chốt: </span>
                  <span className="text-gray-700 dark:text-gray-200">{report.technical?.key_levels}</span>
                </div>
              </div>

              {report.catalysts && report.catalysts.length > 0 && (
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Lịch sự kiện tác động giá
                  </h4>
                  <div className="space-y-2">
                    {report.catalysts.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-[#111923] border border-[#DCE4ED] dark:border-[#2B3948] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold">{cat.event}</div>
                          <div className="text-gray-400 text-[11px]">{cat.why}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-gray-400">{cat.timing}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cat.impact === 'Cao'
                                ? 'bg-rose-500/15 text-rose-500'
                                : cat.impact === 'Thấp'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            Tác động: {cat.impact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Kịch bản diễn biến
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                    <div className="font-bold text-emerald-500 flex items-center gap-1.5">
                      <TrendingUp size={15} /> Tích cực
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      {report.scenarios?.bull}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <div className="font-bold text-amber-500 flex items-center gap-1.5">
                      <Minus size={15} /> Cơ sở
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      {report.scenarios?.base}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                    <div className="font-bold text-rose-500 flex items-center gap-1.5">
                      <TrendingDown size={15} /> Tiêu cực
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      {report.scenarios?.bear}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Rủi ro chính
                  </h4>
                  <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    {report.risks?.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#182331] border border-[#DCE4ED] dark:border-[#2B3948] space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Cần theo dõi
                  </h4>
                  <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    {report.watch_points?.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCE4ED] dark:border-[#2B3948] text-[11px] text-gray-400 space-y-1">
                {report.data_gaps && report.data_gaps.length > 0 && (
                  <div>
                    <b>Hạn chế dữ liệu:</b> {report.data_gaps.join(' · ')}
                  </div>
                )}
                <div>
                  Phân tích lúc {timeVN(currentAnalysis.created_at)} · {currentAnalysis.ai}.
                  Số liệu: DNSE, Vietcap IQ, tin RSS. Phân tích do AI tạo ra chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
