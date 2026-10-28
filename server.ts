import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// VN30 and market tickers
const VN30_SYMBOLS = [
  'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
  'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
  'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
];

const SECTORS: Record<string, { name: string; marketCap: number; sectorEn?: string }> = {
  'ACB': { name: 'Ngân hàng TMCP Á Châu', marketCap: 102000, sectorEn: 'Financials' },
  'BCM': { name: 'Tổng công ty Đầu tư và Phát triển Công nghiệp', marketCap: 70000, sectorEn: 'Real Estate' },
  'BID': { name: 'Ngân hàng TMCP Đầu tư và Phát triển VN', marketCap: 280000, sectorEn: 'Financials' },
  'BVH': { name: 'Tập đoàn Bảo Việt', marketCap: 33000, sectorEn: 'Financials' },
  'CTG': { name: 'Ngân hàng TMCP Công Thương Việt Nam', marketCap: 195000, sectorEn: 'Financials' },
  'FPT': { name: 'Công ty Cổ phần FPT', marketCap: 198000, sectorEn: 'Technology' },
  'GAS': { name: 'Tổng Công ty Khí Việt Nam', marketCap: 180000, sectorEn: 'Energy' },
  'GVR': { name: 'Tập đoàn Công nghiệp Cao su Việt Nam', marketCap: 130000, sectorEn: 'Materials' },
  'HDB': { name: 'Ngân hàng TMCP Phát triển TP.HCM', marketCap: 76000, sectorEn: 'Financials' },
  'HPG': { name: 'Công ty Cổ phần Tập đoàn Hòa Phát', marketCap: 175000, sectorEn: 'Materials' },
  'MBB': { name: 'Ngân hàng TMCP Quân đội', marketCap: 130000, sectorEn: 'Financials' },
  'MSN': { name: 'Công ty Cổ phần Tập đoàn Masan', marketCap: 109000, sectorEn: 'Consumer Staples' },
  'MWG': { name: 'Công ty Cổ phần Đầu tư Thế Giới Di Động', marketCap: 94000, sectorEn: 'Consumer Discretionary' },
  'PLX': { name: 'Tập đoàn Xăng dầu Việt Nam', marketCap: 52000, sectorEn: 'Energy' },
  'POW': { name: 'Tổng Công ty Điện lực Dầu khí Việt Nam', marketCap: 30000, sectorEn: 'Utilities' },
  'SAB': { name: 'Tổng CTCP Bia - Rượu - Nước giải khát Sài Gòn', marketCap: 72000, sectorEn: 'Consumer Staples' },
  'SHB': { name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', marketCap: 41000, sectorEn: 'Financials' },
  'SSB': { name: 'Ngân hàng TMCP Đông Nam Á', marketCap: 45000, sectorEn: 'Financials' },
  'SSI': { name: 'Công ty Cổ phần Chứng khoán SSI', marketCap: 50000, sectorEn: 'Financials' },
  'STB': { name: 'Ngân hàng TMCP Sài Gòn Thương Tín', marketCap: 63000, sectorEn: 'Financials' },
  'TCB': { name: 'Ngân hàng TMCP Kỹ thương Việt Nam', marketCap: 168000, sectorEn: 'Financials' },
  'TPB': { name: 'Ngân hàng TMCP Tiên Phong', marketCap: 40000, sectorEn: 'Financials' },
  'VCB': { name: 'Ngân hàng TMCP Ngoại thương Việt Nam', marketCap: 510000, sectorEn: 'Financials' },
  'VHM': { name: 'Công ty Cổ phần Vinhomes', marketCap: 183000, sectorEn: 'Real Estate' },
  'VIB': { name: 'Ngân hàng TMCP Quốc tế Việt Nam', marketCap: 55000, sectorEn: 'Financials' },
  'VIC': { name: 'Tập đoàn Vingroup', marketCap: 170000, sectorEn: 'Real Estate' },
  'VJC': { name: 'Công ty Cổ phần Hàng không VietJet', marketCap: 57000, sectorEn: 'Industrials' },
  'VNM': { name: 'Công ty Cổ phần Sữa Việt Nam', marketCap: 141000, sectorEn: 'Consumer Staples' },
  'VPB': { name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', marketCap: 153000, sectorEn: 'Financials' },
  'VRE': { name: 'Công ty Cổ phần Vincom Retail', marketCap: 43000, sectorEn: 'Real Estate' },
  'VNINDEX': { name: 'VN-Index (HOSE)', marketCap: 5200000 },
  'VN30': { name: 'VN30 Index', marketCap: 3800000 },
  'HNX': { name: 'HNX-Index', marketCap: 350000 },
  'UPCOM': { name: 'UPCoM-Index', marketCap: 1100000 },
  'VN30F1M': { name: 'VN30 Phái sinh', marketCap: 0 }
};

const BASE_PRICES: Record<string, number> = {
  'ACB': 24.85, 'BCM': 68.2, 'BID': 51.4, 'BVH': 44.5, 'CTG': 36.8,
  'FPT': 136.2, 'GAS': 78.4, 'GVR': 32.6, 'HDB': 26.3, 'HPG': 27.9,
  'MBB': 24.7, 'MSN': 76.8, 'MWG': 64.5, 'PLX': 41.2, 'POW': 12.8,
  'SAB': 56.4, 'SHB': 11.2, 'SSB': 17.5, 'SSI': 32.8, 'STB': 33.6,
  'TCB': 23.9, 'TPB': 18.3, 'VCB': 91.2, 'VHM': 42.1, 'VIB': 21.6,
  'VIC': 43.8, 'VJC': 105.0, 'VNM': 67.8, 'VPB': 19.4, 'VRE': 18.9,
  'VNINDEX': 1285.5, 'VN30': 1324.2, 'HNX': 231.8, 'UPCOM': 92.4, 'VN30F1M': 1326.0
};

function generateRealisticBars(symbol: string, days = 180) {
  const base = BASE_PRICES[symbol] || 35.0;
  const t: number[] = [];
  const o: number[] = [];
  const h: number[] = [];
  const l: number[] = [];
  const c: number[] = [];
  const v: number[] = [];

  const now = new Date();
  let currentClose = base * 0.88;
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const pseudoRandom = Math.sin(seed * 997 + i * 13) * 0.5 + Math.cos(seed * 31 + i * 7) * 0.5;
    const dailyChangePercent = pseudoRandom * 0.025 + 0.0006;
    const openVal = currentClose * (1 + Math.sin(i * 3) * 0.004);
    const closeVal = Math.max(0.5, currentClose * (1 + dailyChangePercent));
    const highVal = Math.max(openVal, closeVal) * (1 + Math.abs(Math.sin(i * 11) * 0.012));
    const lowVal = Math.min(openVal, closeVal) * (1 - Math.abs(Math.cos(i * 17) * 0.012));
    const baseVol = 3200000 + (seed % 15) * 450000;
    const volVal = Math.round(baseVol * (0.6 + Math.abs(pseudoRandom) * 1.3));

    const timestampSec = Math.floor(d.getTime() / 1000);
    t.push(timestampSec);
    o.push(Math.round(openVal * 100) / 100);
    h.push(Math.round(highVal * 100) / 100);
    l.push(Math.round(lowVal * 100) / 100);
    c.push(Math.round(closeVal * 100) / 100);
    v.push(volVal);

    currentClose = closeVal;
  }

  return { t, o, h, l, c, v };
}

function generateBoardRows(symbols = VN30_SYMBOLS) {
  return symbols.map(symbol => {
    const barsData = generateRealisticBars(symbol, 10);
    const len = barsData.c.length;
    const lastClose = barsData.c[len - 1];
    const prevClose = len > 1 ? barsData.c[len - 2] : lastClose;
    const ref = prevClose;
    const price = lastClose;
    const ceil = Math.round(ref * 1.07 * 100) / 100;
    const floor = Math.round(ref * 0.93 * 100) / 100;
    const volume = barsData.v[len - 1];

    return {
      s: symbol,
      st: 'STOCK',
      bo: 'HOSE',
      ref,
      cei: ceil,
      flo: floor,
      c: price,
      op: barsData.o[len - 1],
      h: barsData.h[len - 1],
      l: barsData.l[len - 1],
      vo: volume,
      ptv: Math.round(volume * 0.05),
      va: Math.round(volume * price * 1000),
      pta: Math.round(volume * 0.05 * price * 1e9),
      frbv: Math.round(volume * 0.08),
      frsv: Math.round(volume * 0.04)
    };
  });
}

// 1. /api/market/bars (query: symbol, days, resolution, isIndex, kind)
app.get('/api/market/bars', (req: Request, res: Response) => {
  const symbol = String(req.query.symbol || 'VNINDEX').toUpperCase();
  const days = parseInt(String(req.query.days || '180'), 10);
  const data = generateRealisticBars(symbol, Math.min(days, 800));
  res.json(data);
});

// Also support legacy path `/api/market/bars/:symbol`
app.get('/api/market/bars/:symbol', (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  const days = parseInt(String(req.query.days || req.query.count || '180'), 10);
  const data = generateRealisticBars(symbol, Math.min(days, 800));
  res.json(data);
});

// 2. /api/market/board (supports both GET and POST { group })
const handleBoard = (_req: Request, res: Response) => {
  const rows = generateBoardRows(VN30_SYMBOLS);
  res.json(rows);
};
app.get('/api/market/board', handleBoard);
app.post('/api/market/board', handleBoard);

// 3. /api/market/sectors
app.get('/api/market/sectors', (_req: Request, res: Response) => {
  res.json(SECTORS);
});

// 4. /api/fundamentals/:symbol
app.get('/api/fundamentals/:symbol', (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  const base = BASE_PRICES[symbol] || 32.0;
  const hash = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const meta = SECTORS[symbol] || { name: symbol, marketCap: 25000 };

  const pe = Math.round((9 + (hash % 12) + (hash % 5) * 0.3) * 10) / 10;
  const pb = Math.round((1.1 + (hash % 4) * 0.5) * 10) / 10;
  const roe = Math.round((14 + (hash % 15)) * 10) / 10;

  res.json({
    company: {
      ma: symbol,
      ten: meta.name,
      nganh: (meta as any).sectorEn || 'Kinh doanh',
      von_hoa_ty_dong: meta.marketCap,
      so_luong_cp_luu_hanh: Math.round((meta.marketCap * 1e9) / (base * 1000))
    },
    chi_so_ttm_theo_quy: [
      { quy: 'Q1/2024', pe: pe + 1.2, pb: pb + 0.2, roe: roe / 100 },
      { quy: 'Q2/2024', pe: pe + 0.8, pb: pb + 0.1, roe: roe / 100 },
      { quy: 'Q3/2024', pe: pe + 0.4, pb: pb, roe: roe / 100 },
      { quy: 'Q4/2024', pe, pb, roe: roe / 100 }
    ],
    ket_qua_kinh_doanh_theo_quy: [
      { quy: 'Q4/2024', doanh_thu: 12500, loi_nhuan_sau_thue: 2400 }
    ]
  });
});

// 5. /api/news (supports POST { knownSymbols } and GET)
const sampleNews = [
  {
    title: 'VN-Index tăng điểm nhờ lực kéo dòng tiền nhóm ngân hàng và công nghệ FPT',
    summary: 'Dòng tiền nội tham gia chủ động giúp VN-Index giữ vững sắc xanh. Nhóm cổ phiếu trụ cột VN30 thu hút thanh khoản áp đảo.',
    link: 'https://cafef.vn',
    source: 'CafeF',
    published: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    tickers: ['FPT', 'TCB', 'MBB', 'VCB']
  },
  {
    title: 'Hòa Phát (HPG) tăng trưởng sản lượng thép xây dựng và HRC trong quý 1',
    summary: 'Nhu cầu đầu tư công và bất động sản công nghiệp phục hồi tích cực thúc đẩy sản lượng tiêu thụ thép nội địa và xuất khẩu.',
    link: 'https://vietstock.vn',
    source: 'Vietstock',
    published: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    tickers: ['HPG']
  },
  {
    title: 'Thế Giới Di Động (MWG): Bách Hóa Xanh đóng góp lợi nhuận ròng ổn định',
    summary: 'Mô hình kinh doanh bán lẻ hàng tiêu dùng thiết yếu tiếp tục ghi nhận doanh thu trung bình trên mỗi điểm bán vượt kế hoạch.',
    link: 'https://vnexpress.net',
    source: 'VnExpress',
    published: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tickers: ['MWG']
  },
  {
    title: 'Vinhomes (VHM) bàn giao phân khu đại đô thị mới, dòng tiền khách hàng trả trước kỷ lục',
    summary: 'Tiến độ xây dựng và bàn giao đúng cam kết giúp doanh nghiệp duy trì dòng tiền lành mạnh và chất lượng tài sản vững chắc.',
    link: 'https://cafef.vn',
    source: 'CafeF',
    published: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    tickers: ['VHM', 'VIC', 'VRE']
  },
  {
    title: 'SSI: Định giá thị trường chứng khoán Việt Nam mở ra cơ hội hấp dẫn trong chu kỳ mới',
    summary: 'Tỷ lệ P/E thị trường ở mức hấp dẫn khi triển vọng nâng hạng thị trường FTSE và KRX vận hành chính thức.',
    link: 'https://tinnhanhchungkhoan.vn',
    source: 'Đầu tư CK',
    published: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    tickers: ['SSI']
  }
];

app.get('/api/news', (_req: Request, res: Response) => {
  res.json(sampleNews);
});
app.post('/api/news', (_req: Request, res: Response) => {
  res.json(sampleNews);
});

// 6. /api/ai/models
app.post('/api/ai/models', (_req: Request, res: Response) => {
  res.json(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']);
});

// 7. /api/ai/generate (used by aiService.ts)
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  const { providerId, model, apiKey: userKey, system, prompt, schema } = req.body;
  const apiKey = userKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'Thiếu API Key. Hãy cấu hình Gemini API Key trong Cài đặt hoặc biến môi trường GEMINI_API_KEY.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const targetModel = model || 'gemini-2.5-flash';

    const fullPrompt = `${system ? system + '\n\n' : ''}${prompt}`;

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      res.json(JSON.parse(clean));
    }
  } catch (error: any) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý phản hồi từ AI' });
  }
});

// Start dev or prod server
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`VN Stock Insight server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
