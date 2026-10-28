import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bar,
  BoardRow,
  ChartType,
  DEFAULT_WATCHLIST,
  HeatMetric,
  IndexMeta,
  indexMetas,
  IndicatorType,
  NewsItem,
  SectorInfo,
  Snapshot,
  VN30_SYMBOLS,
} from '../types/market';
import {
  AiConfig,
  AnalysisReport,
  MarketBriefReport,
  PROVIDER_PRESETS,
  SavedAnalysis,
} from '../types/ai';
import {
  analyze,
  fetchBars,
  fetchBoard,
  fetchFundamentals,
  fetchIntraday,
  fetchMany,
  fetchSectors,
  isTradingTime,
} from '../services/marketService';
import { fetchNews, newsFor } from '../services/newsService';
import {
  generateAiJson,
  MARKET_SCHEMA,
  MARKET_SYSTEM,
  marketPrompt,
  STOCK_SCHEMA,
  STOCK_SYSTEM,
  stockPrompt,
} from '../services/aiService';

interface IndexQuoteData {
  meta: IndexMeta;
  bars: Bar[];
  last?: number;
  prev?: number;
  change?: number;
  pct?: number;
  spark: number[];
}

interface AppContextType {
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  effectiveTheme: 'light' | 'dark';
  uiScale: number | null;
  setUiScale: (scale: number | null) => void;
  autoScale: boolean;
  setAutoScale: (val: boolean) => void;

  providerId: string;
  setProviderId: (id: string) => void;
  providerConfigs: Record<string, { baseUrl: string; model: string; apiKey: string }>;
  setProviderConfig: (id: string, conf: Partial<{ baseUrl: string; model: string; apiKey: string }>) => void;
  effort: string;
  setEffort: (eff: string) => void;
  aiConfig: AiConfig;
  aiLabel: string;

  watchlist: string[];
  addWatch: (symbol: string) => Promise<void>;
  removeWatch: (symbol: string) => void;

  stocks: Record<string, Snapshot>;
  vn30Stocks: Snapshot[];
  indexSnapshot: Snapshot | null;
  news: NewsItem[];
  loading: boolean;
  loadError: string | null;
  updatedAt: Date | null;
  refresh: () => Promise<void>;

  dashSelected: string;
  setDashSelected: (symbol: string) => void;
  dashExchange: string;
  setDashExchange: (group: string) => void;
  dashHeatMetric: HeatMetric;
  setDashHeatMetric: (metric: HeatMetric) => void;
  dashQuotes: Record<string, IndexQuoteData>;
  dashBoards: Record<string, BoardRow[]>;
  dashSectors: Record<string, SectorInfo>;
  dashIntraday: Bar[];
  dashLoading: boolean;
  dashError: string | null;
  dashUpdatedAt: Date | null;
  currentMeta: IndexMeta;
  currentQuote: IndexQuoteData | undefined;
  currentBoardRows: BoardRow[];

  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  chartIndicators: Set<IndicatorType>;
  toggleChartIndicator: (indicator: IndicatorType) => void;

  analyses: Record<string, SavedAnalysis>;
  analysisForToday: (symbol: string) => SavedAnalysis | null;
  analyzeStock: (symbol: string, force?: boolean) => Promise<SavedAnalysis>;
  clearAnalyses: () => void;
  marketBrief: MarketBriefReport | null;
  briefLoading: boolean;
  briefError: string | null;
  runMarketBrief: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function getVietnamDayKey(date = new Date()): string {
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('themeMode') as any) || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    function updateTheme() {
      if (themeMode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(isDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(themeMode);
      }
    }
    updateTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', updateTheme);
    return () => media.removeEventListener('change', updateTheme);
  }, [themeMode]);

  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setThemeMode = (mode: 'system' | 'light' | 'dark') => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
  };

  const [uiScale, setUiScaleState] = useState<number | null>(() => {
    const saved = localStorage.getItem('uiScale');
    return saved ? parseFloat(saved) : null;
  });

  const [autoScale, setAutoScaleState] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoScale');
    return saved !== null ? saved === 'true' : true;
  });

  const setUiScale = (s: number | null) => {
    setUiScaleState(s);
    if (s == null) {
      localStorage.removeItem('uiScale');
    } else {
      localStorage.setItem('uiScale', String(s));
    }
  };

  const setAutoScale = (val: boolean) => {
    setAutoScaleState(val);
    localStorage.setItem('autoScale', String(val));
  };

  const [providerId, setProviderIdState] = useState<string>(() => {
    return localStorage.getItem('providerId') || 'gemini';
  });

  const [effort, setEffortState] = useState<string>(() => {
    return localStorage.getItem('effort') || 'medium';
  });

  const [providerConfigs, setProviderConfigs] = useState<
    Record<string, { baseUrl: string; model: string; apiKey: string }>
  >(() => {
    const saved = localStorage.getItem('providerConfigs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const defaults: Record<string, { baseUrl: string; model: string; apiKey: string }> = {};
    for (const p of PROVIDER_PRESETS) {
      defaults[p.id] = {
        baseUrl: p.baseUrl,
        model: p.defaultModel,
        apiKey: '',
      };
    }
    return defaults;
  });

  const setProviderId = (id: string) => {
    setProviderIdState(id);
    localStorage.setItem('providerId', id);
  };

  const setEffort = (eff: string) => {
    setEffortState(eff);
    localStorage.setItem('effort', eff);
  };

  const setProviderConfig = (
    id: string,
    conf: Partial<{ baseUrl: string; model: string; apiKey: string }>
  ) => {
    setProviderConfigs((prev) => {
      const updated = {
        ...prev,
        [id]: {
          baseUrl: conf.baseUrl !== undefined ? conf.baseUrl : prev[id]?.baseUrl || '',
          model: conf.model !== undefined ? conf.model : prev[id]?.model || '',
          apiKey: conf.apiKey !== undefined ? conf.apiKey : prev[id]?.apiKey || '',
        },
      };
      localStorage.setItem('providerConfigs', JSON.stringify(updated));
      return updated;
    });
  };

  const currentPreset = useMemo(() => {
    return PROVIDER_PRESETS.find((p) => p.id === providerId) || PROVIDER_PRESETS[0];
  }, [providerId]);

  const aiConfig = useMemo<AiConfig>(() => {
    const conf = providerConfigs[providerId] || {
      baseUrl: currentPreset.baseUrl,
      model: currentPreset.defaultModel,
      apiKey: '',
    };
    return {
      providerId,
      baseUrl: conf.baseUrl || currentPreset.baseUrl,
      model: conf.model || currentPreset.defaultModel,
      apiKey: conf.apiKey,
      effort,
    };
  }, [providerId, providerConfigs, currentPreset, effort]);

  const aiLabel = useMemo(() => {
    const model = aiConfig.model ? aiConfig.model : 'mặc định';
    return `${currentPreset.name} · ${model}`;
  }, [currentPreset, aiConfig]);

  const [chartType, setChartTypeState] = useState<ChartType>(() => {
    return (localStorage.getItem('chartType') as ChartType) || 'candle';
  });

  const [chartIndicators, setChartIndicatorsState] = useState<Set<IndicatorType>>(() => {
    const saved = localStorage.getItem('chartIndicators');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set<IndicatorType>(['ma20', 'ma50', 'volume']);
  });

  const setChartType = (type: ChartType) => {
    setChartTypeState(type);
    localStorage.setItem('chartType', type);
  };

  const toggleChartIndicator = (ind: IndicatorType) => {
    setChartIndicatorsState((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) {
        next.delete(ind);
      } else {
        next.add(ind);
      }
      localStorage.setItem('chartIndicators', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [...DEFAULT_WATCHLIST];
  });

  const addWatch = async (symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    if (!sym || watchlist.includes(sym)) return;
    const next = [...watchlist, sym];
    setWatchlist(next);
    localStorage.setItem('watchlist', JSON.stringify(next));

    if (!stocks[sym]) {
      const bars = await fetchBars(sym);
      if (bars.length >= 2) {
        setStocks((prev) => ({ ...prev, [sym]: analyze(sym, bars) }));
      }
    }
  };

  const removeWatch = (symbol: string) => {
    const next = watchlist.filter((s) => s !== symbol);
    setWatchlist(next);
    localStorage.setItem('watchlist', JSON.stringify(next));
  };

  const [stocks, setStocks] = useState<Record<string, Snapshot>>({});
  const [indexSnapshot, setIndexSnapshot] = useState<Snapshot | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const vn30Stocks = useMemo(() => {
    return VN30_SYMBOLS.map((s) => stocks[s]).filter(Boolean) as Snapshot[];
  }, [stocks]);

  const [dashSelected, setDashSelected] = useState<string>('VNINDEX');
  const [dashExchange, setDashExchange] = useState<string>('HOSE');
  const [dashHeatMetric, setDashHeatMetric] = useState<HeatMetric>('change');
  const [dashQuotes, setDashQuotes] = useState<Record<string, IndexQuoteData>>({});
  const [dashBoards, setDashBoards] = useState<Record<string, BoardRow[]>>({});
  const [dashSectors, setDashSectors] = useState<Record<string, SectorInfo>>({});
  const [dashIntraday, setDashIntraday] = useState<Bar[]>([]);
  const [dashLoading, setDashLoading] = useState<boolean>(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [dashUpdatedAt, setDashUpdatedAt] = useState<Date | null>(null);

  const currentMeta = useMemo(() => {
    return indexMetas.find((m) => m.symbol === dashSelected) || indexMetas[0];
  }, [dashSelected]);

  const currentQuote = useMemo(() => dashQuotes[dashSelected], [dashQuotes, dashSelected]);

  const currentBoardRows = useMemo(() => {
    return dashBoards[dashExchange] || [];
  }, [dashBoards, dashExchange]);

  const refreshDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const neededGroups = Array.from(new Set([dashExchange, currentMeta.group].filter(Boolean) as string[]));

      const [indexBarsResults, intradayBars, boardResults, sectorMap] = await Promise.all([
        Promise.all(indexMetas.map((m) => fetchBars(m.symbol, { days: 1900, kind: m.kind }))),
        fetchIntraday(dashSelected, currentMeta.kind),
        Promise.all(neededGroups.map((g) => fetchBoard(g).catch(() => []))),
        Object.keys(dashSectors).length > 0 ? Promise.resolve(dashSectors) : fetchSectors(),
      ]);

      const nextQuotes: Record<string, IndexQuoteData> = {};
      indexMetas.forEach((m, idx) => {
        const bars = indexBarsResults[idx] || [];
        const last = bars.length > 0 ? bars[bars.length - 1].c : undefined;
        const prev = bars.length > 1 ? bars[bars.length - 2].c : undefined;
        const change = last != null && prev != null ? last - prev : undefined;
        const p = change != null && prev ? (change / prev) * 100 : undefined;
        const spark = bars.slice(Math.max(0, bars.length - 30)).map((b) => b.c);
        nextQuotes[m.symbol] = { meta: m, bars, last, prev, change, pct: p, spark };
      });

      setDashQuotes(nextQuotes);
      setDashIntraday(intradayBars);

      const nextBoards: Record<string, BoardRow[]> = { ...dashBoards };
      let failedBoards = 0;
      neededGroups.forEach((g, idx) => {
        const rows = boardResults[idx];
        if (rows && rows.length > 0) {
          nextBoards[g] = rows;
        } else {
          failedBoards++;
        }
      });
      setDashBoards(nextBoards);
      setDashSectors(sectorMap);

      if (failedBoards === neededGroups.length && neededGroups.length > 0) {
        setDashError('Không tải được bảng giá sàn. Kiểm tra kết nối mạng.');
      } else {
        setDashError(null);
      }
      setDashUpdatedAt(new Date());
    } catch (e: any) {
      setDashError(`Lỗi tải dữ liệu: ${e.message}`);
    } finally {
      setDashLoading(false);
    }
  }, [dashExchange, currentMeta, dashSelected, dashSectors, dashBoards]);

  const refresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setLoadError(null);

    refreshDashboard();

    try {
      const allSymbols = Array.from(new Set([...VN30_SYMBOLS, ...watchlist]));
      const [fetchedStocks, indexBars, fetchedNews] = await Promise.all([
        fetchMany(allSymbols),
        fetchBars('VNINDEX', { isIndex: true }),
        fetchNews(allSymbols),
      ]);

      setStocks(fetchedStocks);
      if (indexBars.length >= 2) {
        setIndexSnapshot(analyze('VNINDEX', indexBars));
      }
      setNews(fetchedNews);
      setUpdatedAt(new Date());

      if (Object.keys(fetchedStocks).length === 0) {
        setLoadError('Không lấy được dữ liệu giá. Kiểm tra kết nối mạng.');
      }
    } catch (e: any) {
      setLoadError(`Lỗi tải dữ liệu: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [loading, watchlist, refreshDashboard]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      if (isTradingTime()) {
        refreshDashboard();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const [analyses, setAnalyses] = useState<Record<string, SavedAnalysis>>(() => {
    const saved = localStorage.getItem('analyses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const saveAnalyses = (updated: Record<string, SavedAnalysis>) => {
    setAnalyses(updated);
    localStorage.setItem('analyses', JSON.stringify(updated));
  };

  const clearAnalyses = () => {
    setAnalyses({});
    localStorage.removeItem('analyses');
  };

  const analysisForToday = useCallback(
    (symbol: string): SavedAnalysis | null => {
      const record = analyses[symbol];
      if (!record || !record.created_at) return null;
      const createdKey = getVietnamDayKey(new Date(record.created_at));
      const todayKey = getVietnamDayKey(new Date());
      if (createdKey !== todayKey) return null;
      return record;
    },
    [analyses]
  );

  const analyzeStock = async (symbol: string, force = false): Promise<SavedAnalysis> => {
    const sym = symbol.toUpperCase().trim();
    if (!force) {
      const cached = analysisForToday(sym);
      if (cached) return cached;
    }

    const bars = await fetchBars(sym);
    if (bars.length < 30) {
      throw new Error(`Không tìm thấy dữ liệu giá cho mã ${sym}.`);
    }

    const snap = analyze(sym, bars);
    setStocks((prev) => ({ ...prev, [sym]: snap }));

    const fundamentals = await fetchFundamentals(sym);
    const relatedNews = newsFor(news, sym).map((n) => ({
      title: n.title,
      summary: n.summary,
      source: n.source,
      published: n.published.substring(0, 16),
    }));

    const inputs = {
      technicals: { ...snap.data, signals: snap.signals, tech_score: snap.techScore },
      fundamentals,
      news: relatedNews,
    };

    const prompt = stockPrompt(sym, inputs);
    const result: AnalysisReport = await generateAiJson(aiConfig, {
      system: STOCK_SYSTEM,
      prompt,
      schema: STOCK_SCHEMA,
      schemaName: 'stock_analysis',
    });

    const record: SavedAnalysis = {
      symbol: sym,
      created_at: new Date().toISOString(),
      ai: aiLabel,
      inputs,
      result,
    };

    const updated = { ...analyses, [sym]: record };
    const keys = Object.keys(updated);
    if (keys.length > 100) {
      keys.sort((a, b) => updated[b].created_at.localeCompare(updated[a].created_at));
      const trimmed: Record<string, SavedAnalysis> = {};
      for (const k of keys.slice(0, 100)) {
        trimmed[k] = updated[k];
      }
      saveAnalyses(trimmed);
    } else {
      saveAnalyses(updated);
    }

    return record;
  };

  const [marketBrief, setMarketBrief] = useState<MarketBriefReport | null>(null);
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const runMarketBrief = async () => {
    if (!indexSnapshot) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const movers = vn30Stocks
        .map((s) => {
          const sigs = s.signals.length ? `, tín hiệu: ${s.signals.join(', ')}` : '';
          return `${s.symbol}: ${s.close} (${s.data['change_1d']}% hôm nay, ${s.data['change_1m']}% 1 tháng)${sigs}`;
        })
        .join('\n');

      const recentNews = news.slice(0, 30).map((n) => ({
        title: n.title,
        summary: n.summary,
        source: n.source,
        published: n.published.substring(0, 16),
      }));

      const prompt = marketPrompt(
        { ...indexSnapshot.data, signals: indexSnapshot.signals, tech_score: indexSnapshot.techScore },
        movers,
        recentNews
      );

      const briefResult = await generateAiJson(aiConfig, {
        system: MARKET_SYSTEM,
        prompt,
        schema: MARKET_SCHEMA,
        schemaName: 'market_brief',
      });

      setMarketBrief(briefResult);
    } catch (e: any) {
      setBriefError(e.message || 'Lỗi nhận định thị trường');
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        themeMode,
        setThemeMode,
        effectiveTheme,
        uiScale,
        setUiScale,
        autoScale,
        setAutoScale,
        providerId,
        setProviderId,
        providerConfigs,
        setProviderConfig,
        effort,
        setEffort,
        aiConfig,
        aiLabel,
        watchlist,
        addWatch,
        removeWatch,
        stocks,
        vn30Stocks,
        indexSnapshot,
        news,
        loading,
        loadError,
        updatedAt,
        refresh,
        dashSelected,
        setDashSelected,
        dashExchange,
        setDashExchange,
        dashHeatMetric,
        setDashHeatMetric,
        dashQuotes,
        dashBoards,
        dashSectors,
        dashIntraday,
        dashLoading,
        dashError,
        dashUpdatedAt,
        currentMeta,
        currentQuote,
        currentBoardRows,
        chartType,
        setChartType,
        chartIndicators,
        toggleChartIndicator,
        analyses,
        analysisForToday,
        analyzeStock,
        clearAnalyses,
        marketBrief,
        briefLoading,
        briefError,
        runMarketBrief,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
