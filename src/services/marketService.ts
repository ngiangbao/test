import { Bar, BoardRow, SectorInfo, Snapshot, BoardStats } from '../types/market';

export function parseBars(d: any): Bar[] {
  if (!d || !d.t || !Array.isArray(d.t)) return [];
  const t = d.t;
  const o = d.o || [];
  const h = d.h || [];
  const l = d.l || [];
  const c = d.c || [];
  const v = d.v || [];

  const bars: Bar[] = [];
  for (let i = 0; i < t.length; i++) {
    bars.push({
      t: Number(t[i]),
      o: Number(o[i] || 0),
      h: Number(h[i] || 0),
      l: Number(l[i] || 0),
      c: Number(c[i] || 0),
      v: Number(v[i] || 0),
    });
  }
  return bars;
}

export async function fetchBars(
  symbol: string,
  options?: { days?: number; isIndex?: boolean; kind?: string; resolution?: string }
): Promise<Bar[]> {
  const days = options?.days ?? 400;
  const isIndex = options?.isIndex ?? false;
  const kind = options?.kind ?? (isIndex ? 'index' : 'stock');
  const resolution = options?.resolution ?? '1D';

  try {
    const res = await fetch(
      `/api/market/bars?symbol=${encodeURIComponent(symbol)}&days=${days}&isIndex=${isIndex}&kind=${kind}&resolution=${resolution}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return parseBars(data);
  } catch (e) {
    console.error(`Failed to fetch bars for ${symbol}:`, e);
    return [];
  }
}

export function vnDate(t: number): string {
  const d = new Date((t + 7 * 3600) * 1000);
  return d.toISOString().substring(0, 10);
}

export function lastSession(bars: Bar[]): Bar[] {
  if (bars.length === 0) return bars;
  const lastDay = vnDate(bars[bars.length - 1].t);
  return bars.filter((b) => vnDate(b.t) === lastDay);
}

export async function fetchIntraday(symbol: string, kind = 'index'): Promise<Bar[]> {
  const bars = await fetchBars(symbol, { days: 5, kind, resolution: '1' });
  return lastSession(bars);
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sma(xs: number[], n: number): number | null {
  return xs.length >= n ? avg(xs.slice(xs.length - n)) : null;
}

export function round(x: number | null | undefined, d = 2): number | null {
  if (x == null || !isFinite(x)) return null;
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

export function pct(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0) return null;
  return round((a / b - 1) * 100);
}

export function ema(xs: number[], n: number): number[] {
  if (xs.length === 0) return [];
  const k = 2 / (n + 1);
  const out = [xs[0]];
  for (let i = 1; i < xs.length; i++) {
    out.push(xs[i] * k + out[out.length - 1] * (1 - k));
  }
  return out;
}

export function rsi(closes: number[], n = 14): number | null {
  if (closes.length <= n) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    gain += Math.max(d, 0);
    loss += Math.max(-d, 0);
  }
  gain /= n;
  loss /= n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
  }
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}

export function smaSeries(xs: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(xs.length).fill(null);
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    sum += xs[i];
    if (i >= n) sum -= xs[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function emaSeries(xs: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(xs.length).fill(null);
  if (xs.length < n) return out;
  const k = 2 / (n + 1);
  let e = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = e;
  for (let i = n; i < xs.length; i++) {
    e = xs[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

export function rsiSeries(xs: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = new Array(xs.length).fill(null);
  if (xs.length <= n) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = xs[i] - xs[i - 1];
    gain += Math.max(d, 0);
    loss += Math.max(-d, 0);
  }
  gain /= n;
  loss /= n;
  out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function bollingerSeries(xs: number[], n = 20, k = 2): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = smaSeries(xs, n);
  const upper: (number | null)[] = new Array(xs.length).fill(null);
  const lower: (number | null)[] = new Array(xs.length).fill(null);
  for (let i = n - 1; i < xs.length; i++) {
    const m = mid[i]!;
    let v = 0;
    for (let j = i - n + 1; j <= i; j++) {
      v += (xs[j] - m) * (xs[j] - m);
    }
    const sd = Math.sqrt(v / n);
    upper[i] = m + k * sd;
    lower[i] = m - k * sd;
  }
  return { mid, upper, lower };
}

export function macdSeries(xs: number[]): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const fast = emaSeries(xs, 12);
  const slow = emaSeries(xs, 26);
  const macd: (number | null)[] = [];
  for (let i = 0; i < xs.length; i++) {
    macd.push(fast[i] != null && slow[i] != null ? fast[i]! - slow[i]! : null);
  }
  const start = macd.findIndex((x) => x != null);
  const signal: (number | null)[] = new Array(xs.length).fill(null);
  if (start >= 0) {
    const valid = macd.slice(start) as number[];
    const sig = emaSeries(valid, 9);
    for (let i = 0; i < sig.length; i++) {
      signal[start + i] = sig[i];
    }
  }
  const hist = macd.map((m, i) => (m != null && signal[i] != null ? m - signal[i]! : null));
  return { macd, signal, hist };
}

export function stochasticSeries(bars: Bar[], n = 14, d = 3): { k: (number | null)[]; d: (number | null)[] } {
  const kArr: (number | null)[] = new Array(bars.length).fill(null);
  for (let i = n - 1; i < bars.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      hh = Math.max(hh, bars[j].h);
      ll = Math.min(ll, bars[j].l);
    }
    kArr[i] = hh === ll ? 50 : ((bars[i].c - ll) / (hh - ll)) * 100;
  }
  const dArr: (number | null)[] = new Array(bars.length).fill(null);
  for (let i = n - 1 + d - 1; i < bars.length; i++) {
    dArr[i] = (kArr[i]! + kArr[i - 1]! + kArr[i - 2]!) / 3;
  }
  return { k: kArr, d: dArr };
}

export function heikinAshi(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const c = (b.o + b.h + b.l + b.c) / 4;
    const o = i === 0 ? (b.o + b.c) / 2 : (out[i - 1].o + out[i - 1].c) / 2;
    out.push({
      t: b.t,
      o,
      h: Math.max(b.h, Math.max(o, c)),
      l: Math.min(b.l, Math.min(o, c)),
      c,
      v: b.v,
    });
  }
  return out;
}

export function analyze(symbol: string, bars: Bar[]): Snapshot {
  const closes = bars.map((b) => b.c);
  const vols = bars.map((b) => b.v);
  const last = closes[closes.length - 1];

  const back = (n: number) => (closes.length > n ? closes[closes.length - 1 - n] : null);

  const ma20 = sma(closes, 20);
  const ma50 = sma(closes, 50);
  const ma200 = sma(closes, 200);
  const rsi14 = rsi(closes);

  const ema26 = ema(closes, 26);
  const ema12 = ema(closes, 12);
  const macdVal = ema12.map((x, i) => x - ema26[i]);
  const signalVal = ema(macdVal, 9);
  const hist = macdVal[macdVal.length - 1] - signalVal[signalVal.length - 1];
  const histPrev =
    closes.length > 1 ? macdVal[macdVal.length - 2] - signalVal[signalVal.length - 2] : hist;

  const std20 =
    ma20 == null
      ? null
      : Math.sqrt(avg(closes.slice(closes.length - 20).map((c) => (c - ma20) * (c - ma20))));

  const recent = bars.slice(Math.max(0, bars.length - 14));
  const hh = Math.max(...recent.map((b) => b.h));
  const ll = Math.min(...recent.map((b) => b.l));

  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    trs.push(
      Math.max(
        bars[i].h - bars[i].l,
        Math.max(Math.abs(bars[i].h - bars[i - 1].c), Math.abs(bars[i].l - bars[i - 1].c))
      )
    );
  }
  const atr14 = trs.length >= 14 ? avg(trs.slice(trs.length - 14)) : null;

  const avgVol20 = vols.length > 20 ? sma(vols.slice(0, vols.length - 1), 20) : null;
  const volRatio = avgVol20 == null || avgVol20 === 0 ? null : round(vols[vols.length - 1] / avgVol20);

  const year = bars.slice(Math.max(0, bars.length - 250));
  const high52 = Math.max(...year.map((b) => b.h));
  const low52 = Math.min(...year.map((b) => b.l));
  const change1d = pct(last, back(1));

  const signals: string[] = [];
  let score = 0;
  if (ma20 != null && ma50 != null) {
    if (last > ma20 && ma20 > ma50) {
      signals.push('Xu hướng tăng (giá > MA20 > MA50)');
      score += 2;
    } else if (last < ma20 && ma20 < ma50) {
      signals.push('Xu hướng giảm (giá < MA20 < MA50)');
      score -= 2;
    }
  }
  if (ma200 != null) score += last > ma200 ? 1 : -1;
  if (rsi14 != null && rsi14 >= 70) {
    signals.push(`RSI quá mua (${Math.round(rsi14)})`);
    score -= 1;
  } else if (rsi14 != null && rsi14 <= 30) {
    signals.push(`RSI quá bán (${Math.round(rsi14)})`);
    score += 1;
  }
  if (hist > 0 && histPrev <= 0) {
    signals.push('MACD cắt lên đường tín hiệu');
    score += 1;
  } else if (hist < 0 && histPrev >= 0) {
    signals.push('MACD cắt xuống đường tín hiệu');
    score -= 1;
  }
  if (volRatio != null && volRatio >= 1.8) {
    const up = (change1d ?? 0) >= 0;
    signals.push(`Khối lượng đột biến x${volRatio} kèm giá ${up ? 'tăng' : 'giảm'}`);
    score += up ? 1 : -1;
  }
  if (last >= high52 * 0.98) signals.push('Sát đỉnh 52 tuần');
  if (last <= low52 * 1.02) signals.push('Sát đáy 52 tuần');

  const date = new Date((bars[bars.length - 1].t + 7 * 3600) * 1000).toISOString().substring(0, 10);

  const data: Record<string, any> = {
    date,
    close: last,
    change_1d: change1d,
    change_1w: pct(last, back(5)),
    change_1m: pct(last, back(20)),
    change_3m: pct(last, back(60)),
    change_1y: pct(last, back(250)),
    ma20: round(ma20),
    ma50: round(ma50),
    ma200: round(ma200),
    rsi14: round(rsi14, 1),
    macd: round(macdVal[macdVal.length - 1], 3),
    macd_signal: round(signalVal[signalVal.length - 1], 3),
    bollinger_upper: round(ma20 != null && std20 != null ? ma20 + 2 * std20 : null),
    bollinger_lower: round(ma20 != null && std20 != null ? ma20 - 2 * std20 : null),
    stochastic_k: round(hh === ll ? 50 : ((last - ll) / (hh - ll)) * 100, 1),
    atr14_pct: round(atr14 == null ? null : (atr14 / last) * 100),
    volume: vols[vols.length - 1],
    vol_ratio: volRatio,
    high_52w: high52,
    low_52w: low52,
    from_high_52w: pct(last, high52),
  };

  return {
    symbol,
    data,
    signals,
    techScore: score,
    spark: closes.slice(Math.max(0, closes.length - 60)),
    bars,
    close: last,
  };
}

export async function fetchMany(symbols: Iterable<string>, parallel = 6): Promise<Record<string, Snapshot>> {
  const out: Record<string, Snapshot> = {};
  const queue = Array.from(symbols);

  async function worker() {
    while (queue.length > 0) {
      const s = queue.pop();
      if (!s) break;
      const bars = await fetchBars(s);
      if (bars.length >= 2) {
        out[s] = analyze(s, bars);
      }
    }
  }

  const workers = Array.from({ length: Math.min(parallel, queue.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

export function parseBoard(json: any[]): BoardRow[] {
  if (!Array.isArray(json)) return [];
  const out: BoardRow[] = [];
  for (const e of json) {
    if (!e || e.st !== 'STOCK') continue;
    const ref = Number(e.ref || 0);
    if (ref <= 0) continue;
    const c = Number(e.c || 0);
    const price = c > 0 ? c : ref;
    const ceil = Number(e.cei || 0);
    const floor = Number(e.flo || 0);

    let exchange = String(e.bo || '');
    if (exchange === 'HSX') exchange = 'HOSE';

    out.push({
      symbol: String(e.s),
      exchange,
      ref,
      ceil,
      floor,
      price,
      open: Number(e.op || 0),
      high: Number(e.h || 0),
      low: Number(e.l || 0),
      volume: Number(e.vo || 0),
      ptVolume: Number(e.ptv || 0),
      valueMn: Number(e.va || 0),
      ptValueMn: Number(e.pta || 0) / 1e6,
      foreignBuy: Number(e.frbv || 0),
      foreignSell: Number(e.frsv || 0),
      pct: ref > 0 ? ((price / ref) - 1) * 100 : 0,
      atCeil: ceil > 0 && price >= ceil,
      atFloor: floor > 0 && price > 0 && price <= floor,
      dir: price > ref ? 1 : price < ref ? -1 : 0,
    });
  }
  return out;
}

export async function fetchBoard(group: string): Promise<BoardRow[]> {
  const resp = await fetch('/api/market/board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group }),
  });
  if (!resp.ok) throw new Error(`Bảng giá ${group}: HTTP ${resp.status}`);
  const data = await resp.json();
  return parseBoard(data);
}

export function computeBoardStats(rows: BoardRow[]): BoardStats {
  let up = 0, down = 0, flat = 0, ceil = 0, floor = 0;
  let upValueMn = 0, downValueMn = 0, flatValueMn = 0;
  let volume = 0, ptVolume = 0, valueMn = 0, ptValueMn = 0;
  let foreignBuy = 0, foreignSell = 0;

  for (const r of rows) {
    if (r.dir === 1) {
      up++;
      upValueMn += r.valueMn;
    } else if (r.dir === -1) {
      down++;
      downValueMn += r.valueMn;
    } else {
      flat++;
      flatValueMn += r.valueMn;
    }
    if (r.atCeil) ceil++;
    if (r.atFloor) floor++;
    volume += r.volume;
    ptVolume += r.ptVolume;
    valueMn += r.valueMn;
    ptValueMn += r.ptValueMn;
    foreignBuy += r.foreignBuy;
    foreignSell += r.foreignSell;
  }

  const totalVolume = volume + ptVolume;
  const totalValueTy = (valueMn + ptValueMn) / 1000;

  return {
    up, down, flat, ceil, floor,
    upValueMn, downValueMn, flatValueMn,
    volume, ptVolume, valueMn, ptValueMn,
    foreignBuy, foreignSell,
    totalVolume, totalValueTy,
    hasData: up + down + flat > 0,
  };
}

export async function fetchSectors(): Promise<Record<string, SectorInfo>> {
  try {
    const resp = await fetch('/api/market/sectors');
    if (!resp.ok) return {};
    return await resp.json();
  } catch {
    return {};
  }
}

export async function fetchFundamentals(symbol: string): Promise<Record<string, any>> {
  try {
    const resp = await fetch(`/api/fundamentals/${symbol}`);
    if (!resp.ok) return {};
    return await resp.json();
  } catch {
    return {};
  }
}

export function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || isNaN(n)) return '–';
  let s = n.toFixed(digits);
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  const parts = s.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
}

export function timeVN(d: string | Date | number): string {
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  const vnTime = new Date(date.getTime() + 7 * 3600 * 1000);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(vnTime.getUTCHours())}:${pad(vnTime.getUTCMinutes())} ${pad(vnTime.getUTCDate())}/${pad(vnTime.getUTCMonth() + 1)}/${vnTime.getUTCFullYear()}`;
}

export function timeLocal(d: string | Date | number): string {
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function isTradingTime(): boolean {
  const now = new Date();
  const vn = new Date(now.getTime() + 7 * 3600 * 1000);
  const day = vn.getUTCDay();
  if (day === 0 || day === 6) return false;
  const m = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  return m >= 9 * 60 && m <= 15 * 60 + 5;
}
