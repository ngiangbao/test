export interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Snapshot {
  symbol: string;
  data: Record<string, any>;
  signals: string[];
  techScore: number;
  spark: number[];
  bars: Bar[];
  close: number;
}

export interface BoardRow {
  symbol: string;
  exchange: string;
  ref: number;
  ceil: number;
  floor: number;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  ptVolume: number;
  valueMn: number;
  ptValueMn: number;
  foreignBuy: number;
  foreignSell: number;
  pct: number;
  atCeil: boolean;
  atFloor: boolean;
  dir: 1 | -1 | 0; // 1: up, -1: down, 0: flat
}

export interface SectorInfo {
  name: string;
  marketCap: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  link: string;
  source: string;
  published: string;
  tickers: string[];
}

export interface IndexMeta {
  symbol: string;
  name: string;
  desc: string;
  kind: 'index' | 'stock' | 'derivative';
  group: string | null;
}

export const indexMetas: IndexMeta[] = [
  { symbol: 'VNINDEX', name: 'VNINDEX', desc: 'Chỉ số VN-Index (HOSE)', kind: 'index', group: 'HOSE' },
  { symbol: 'HNX', name: 'HNXINDEX', desc: 'Chỉ số HNX-Index', kind: 'index', group: 'HNX' },
  { symbol: 'UPCOM', name: 'UPINDEX', desc: 'Chỉ số UPCOM-Index', kind: 'index', group: 'UPCOM' },
  { symbol: 'VN30', name: 'VN30', desc: 'Chỉ số VN30', kind: 'index', group: 'VN30' },
  { symbol: 'VN30F1M', name: 'VN30F1M', desc: 'Hợp đồng tương lai VN30 tháng gần', kind: 'derivative', group: null },
];

export const VN30_SYMBOLS = [
  'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
  'LPB', 'MBB', 'MSN', 'MWG', 'PLX', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
  'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE',
];

export const DEFAULT_WATCHLIST = ['FPT', 'VCB', 'HPG', 'MWG', 'TCB', 'SSI'];

export type HeatMetric = 'change' | 'foreignNet' | 'liquidity';

export type ChartType = 'candle' | 'hollow' | 'ohlc' | 'line' | 'area' | 'baseline' | 'heikinAshi';

export type IndicatorType =
  | 'ma10'
  | 'ma20'
  | 'ma50'
  | 'ma200'
  | 'ema20'
  | 'bollinger'
  | 'volume'
  | 'rsi'
  | 'macd'
  | 'stoch';

export interface BoardStats {
  up: number;
  down: number;
  flat: number;
  ceil: number;
  floor: number;
  upValueMn: number;
  downValueMn: number;
  flatValueMn: number;
  volume: number;
  ptVolume: number;
  valueMn: number;
  ptValueMn: number;
  foreignBuy: number;
  foreignSell: number;
  totalVolume: number;
  totalValueTy: number;
  hasData: boolean;
}
