import { NewsItem } from '../types/market';

export async function fetchNews(knownSymbols: string[]): Promise<NewsItem[]> {
  try {
    const resp = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knownSymbols }),
    });
    if (!resp.ok) return [];
    return await resp.json();
  } catch (e) {
    console.error('Failed to fetch news:', e);
    return [];
  }
}

export function newsFor(news: NewsItem[], symbol: string, limit = 15): NewsItem[] {
  const sym = symbol.toUpperCase();
  const mention = new RegExp(`\\b${sym}\\b`, 'i');
  return news
    .filter((n) => n.tickers.includes(sym) || mention.test(n.title))
    .slice(0, limit);
}
