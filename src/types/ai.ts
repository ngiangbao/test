export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  style: 'anthropic' | 'openai';
  local?: boolean;
  needsKey?: boolean;
  keyHint?: string;
  note?: string;
  suggestedModels?: string[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    style: 'openai',
    keyHint: 'Tạo key tại aistudio.google.com (hoặc dùng key hệ thống)',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    style: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-5-5',
    suggestedModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
    keyHint: 'Tạo key tại platform.claude.com',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    style: 'openai',
    keyHint: 'Tạo key tại platform.openai.com',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (nhiều model)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.5-flash',
    style: 'openai',
    keyHint: 'Tạo key tại openrouter.ai',
    note: 'Một key dùng được hàng trăm model của nhiều hãng.',
    suggestedModels: ['google/gemini-2.5-flash', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat'],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    style: 'openai',
    keyHint: 'console.groq.com',
    suggestedModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    style: 'openai',
    keyHint: 'platform.deepseek.com',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    style: 'openai',
    keyHint: 'console.x.ai',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    style: 'openai',
    keyHint: 'api.together.ai',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (trên máy)',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local',
    style: 'openai',
    local: true,
    needsKey: false,
    note: 'Mở LM Studio → Developer → Start Server. Context length khuyến nghị ≥ 8192.',
  },
  {
    id: 'ollama',
    name: 'Ollama (trên máy)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen3:8b',
    style: 'openai',
    local: true,
    needsKey: false,
    note: 'Cài Ollama và chạy model tương thích (qwen3, gemma3).',
  },
  {
    id: 'custom',
    name: 'Tùy chỉnh (chuẩn OpenAI)',
    baseUrl: 'http://localhost:8080/v1',
    defaultModel: '',
    style: 'openai',
    needsKey: false,
    note: 'Bất kỳ dịch vụ nào có API tương thích OpenAI.',
  },
];

export interface AiConfig {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  effort: string;
}

export interface ScorecardItem {
  dimension: string;
  score: number;
  reason: string;
}

export interface CatalystItem {
  event: string;
  timing: string;
  impact: 'Cao' | 'Trung bình' | 'Thấp';
  why: string;
}

export interface AnalysisReport {
  stance: 'Tích cực' | 'Trung lập' | 'Tiêu cực';
  confidence: 'Thấp' | 'Trung bình' | 'Cao';
  headline: string;
  summary: string;
  scorecard: ScorecardItem[];
  thesis: {
    statement: string;
    pillars: string[];
    invalidation: string[];
  };
  earnings: {
    summary: string;
    highlights: string[];
  };
  valuation: string;
  competition: string;
  technical: {
    summary: string;
    key_levels: string;
  };
  catalysts: CatalystItem[];
  scenarios: {
    bull: string;
    base: string;
    bear: string;
  };
  risks: string[];
  watch_points: string[];
  data_gaps: string[];
}

export interface SavedAnalysis {
  symbol: string;
  created_at: string;
  ai: string;
  inputs: {
    technicals: Record<string, any>;
    fundamentals: Record<string, any>;
    news: any[];
  };
  result: AnalysisReport;
}

export interface MarketBriefTheme {
  theme: string;
  detail: string;
  tickers: string[];
}

export interface MarketBriefReport {
  mood: 'Tích cực' | 'Trung lập' | 'Tiêu cực';
  headline: string;
  summary: string;
  themes: MarketBriefTheme[];
  watch_list: string[];
}
