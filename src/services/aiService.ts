import { AiConfig, AnalysisReport, MarketBriefReport } from '../types/ai';

const COMMON_SYSTEM = `Bạn là chuyên viên phân tích cổ phiếu Việt Nam, viết bằng tiếng Việt cho nhà đầu tư cá nhân.

Nguyên tắc chung:
- Chỉ dùng dữ liệu được cung cấp. Không bịa số liệu, ngày tháng, sự kiện. Thiếu dữ liệu thì nói rõ là thiếu.
- Trích số cụ thể khi nhận định (ví dụ "LNST quý 2/2026 tăng 18% so với cùng kỳ", "P/E 10,7 lần, thấp hơn trung bình 8 quý là 14 lần").
- Theo dõi bằng chứng ngược chiều nghiêm túc như bằng chứng ủng hộ.
- Đây là tài liệu tham khảo để người đọc tự quyết định, không phải lời khuyên mua/bán. Không đưa ra lệnh mua/bán hay tỷ trọng.
- Giá cổ phiếu tính theo nghìn đồng, số liệu tài chính theo tỷ đồng. Thị trường thanh toán T+2, biên độ HOSE ±7%, HNX ±10%, UPCoM ±15%.`;

export const STOCK_SYSTEM = `${COMMON_SYSTEM}

Áp dụng lần lượt các khung phân tích sau:

1. Luận điểm đầu tư (thesis tracker)
- Viết luận điểm cốt lõi 1–2 câu. Luận điểm phải kiểm chứng được: phải có điều gì đó có thể bác bỏ nó.
- 3–5 trụ cột hỗ trợ, mỗi trụ cột gắn với một số liệu cụ thể.
- 3–5 điều kiện làm luận điểm sai (tín hiệu cần thoát khỏi luận điểm).

2. Phân tích kết quả kinh doanh (earnings analysis)
- Mở đầu bằng điều MỚI: quý gần nhất tăng hay giảm so với cùng kỳ và quý trước, lượng hóa mức chênh lệch.
- Giải thích nguyên nhân dựa trên biên lợi nhuận và các khoản mục; nêu xu hướng 4–8 quý.
- Với ngân hàng: tập trung NIM, nợ xấu (NPL), CIR, tăng trưởng tín dụng/huy động, CASA.

3. Định giá tương đối (comps / valuation)
- So sánh P/E, P/B, EV/EBITDA hiện tại với lịch sử 8 quý của chính doanh nghiệp.
- Đặt trong bối cảnh ngành và chất lượng tăng trưởng (ROE, biên lợi nhuận). Có thể nêu khuyến nghị và giá mục tiêu của Vietcap như một góc nhìn bên thứ ba, ghi rõ nguồn và ngày.
- Không tự đưa ra giá mục tiêu chính xác; chỉ nêu vùng định giá hợp lý một cách định tính nếu dữ liệu cho phép.

4. Vị thế cạnh tranh (competitive analysis)
- Ngắn gọn: doanh nghiệp đứng ở đâu trong ngành, lợi thế và điểm yếu, dựa trên dữ liệu và hiểu biết chung đã được kiểm chứng rộng rãi. Không bịa thị phần.

5. Lịch sự kiện (catalyst calendar)
- Các sự kiện sắp tới có thể làm giá biến động: công bố kết quả quý, đại hội cổ đông, chia cổ tức, phát hành, kỳ cơ cấu rổ chỉ số, vĩ mô.
- Mỗi sự kiện: thời điểm dự kiến, mức tác động Cao/Trung bình/Thấp, và lý do.

6. Kỹ thuật
- Xu hướng theo MA20/50/200, động lượng (RSI, MACD, Stochastic), biến động (Bollinger, ATR), dòng tiền (khối lượng so với trung bình 20 phiên).
- Vùng hỗ trợ/kháng cự ước tính từ dữ liệu giá.

7. Bảng chấm điểm 8 tiêu chí, mỗi tiêu chí 1–5 điểm (5 là tốt nhất), kèm lý do 1 câu:
Xu hướng giá; Động lượng; Dòng tiền & thanh khoản; Định giá; Tăng trưởng; Khả năng sinh lời; Sức khỏe tài chính; Tin tức & sự kiện.

8. Kịch bản: tích cực / cơ sở / tiêu cực, mỗi kịch bản nêu điều kiện xảy ra và hệ quả với giá (định tính).`;

export const MARKET_SYSTEM = COMMON_SYSTEM;

export const STOCK_SCHEMA = {
  type: 'object',
  properties: {
    stance: { type: 'string', enum: ['Tích cực', 'Trung lập', 'Tiêu cực'] },
    confidence: { type: 'string', enum: ['Thấp', 'Trung bình', 'Cao'] },
    headline: { type: 'string' },
    summary: { type: 'string' },
    scorecard: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dimension: {
            type: 'string',
            enum: [
              'Xu hướng giá',
              'Động lượng',
              'Dòng tiền & thanh khoản',
              'Định giá',
              'Tăng trưởng',
              'Khả năng sinh lời',
              'Sức khỏe tài chính',
              'Tin tức & sự kiện',
            ],
          },
          score: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          reason: { type: 'string' },
        },
        required: ['dimension', 'score', 'reason'],
      },
    },
    thesis: {
      type: 'object',
      properties: {
        statement: { type: 'string' },
        pillars: { type: 'array', items: { type: 'string' } },
        invalidation: { type: 'array', items: { type: 'string' } },
      },
      required: ['statement', 'pillars', 'invalidation'],
    },
    earnings: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'highlights'],
    },
    valuation: { type: 'string' },
    competition: { type: 'string' },
    technical: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        key_levels: { type: 'string' },
      },
      required: ['summary', 'key_levels'],
    },
    catalysts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          timing: { type: 'string' },
          impact: { type: 'string', enum: ['Cao', 'Trung bình', 'Thấp'] },
          why: { type: 'string' },
        },
        required: ['event', 'timing', 'impact', 'why'],
      },
    },
    scenarios: {
      type: 'object',
      properties: {
        bull: { type: 'string' },
        base: { type: 'string' },
        bear: { type: 'string' },
      },
      required: ['bull', 'base', 'bear'],
    },
    risks: { type: 'array', items: { type: 'string' } },
    watch_points: { type: 'array', items: { type: 'string' } },
    data_gaps: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'stance',
    'confidence',
    'headline',
    'summary',
    'scorecard',
    'thesis',
    'earnings',
    'valuation',
    'competition',
    'technical',
    'catalysts',
    'scenarios',
    'risks',
    'watch_points',
    'data_gaps',
  ],
};

export const MARKET_SCHEMA = {
  type: 'object',
  properties: {
    mood: { type: 'string', enum: ['Tích cực', 'Trung lập', 'Tiêu cực'] },
    headline: { type: 'string' },
    summary: { type: 'string' },
    themes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          theme: { type: 'string' },
          detail: { type: 'string' },
          tickers: { type: 'array', items: { type: 'string' } },
        },
        required: ['theme', 'detail', 'tickers'],
      },
    },
    watch_list: { type: 'array', items: { type: 'string' } },
  },
  required: ['mood', 'headline', 'summary', 'themes', 'watch_list'],
};

function todayVN(): string {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return d.toISOString().substring(0, 10);
}

export function stockPrompt(symbol: string, inputs: Record<string, any>): string {
  return `Hôm nay là ${todayVN()}. Phân tích chuyên sâu cổ phiếu ${symbol}.

## Dữ liệu kỹ thuật (giá nghìn đồng)
${JSON.stringify(inputs.technicals)}

## Dữ liệu cơ bản
${JSON.stringify(inputs.fundamentals)}

## Tin tức liên quan 48 giờ qua
${JSON.stringify(inputs.news)}

Yêu cầu độ dài: headline 1 câu; summary 3–5 câu; mỗi đoạn phân tích 2–5 câu; mỗi danh sách 2–5 ý ngắn.
scorecard phải có đủ 8 tiêu chí theo đúng thứ tự. data_gaps liệt kê dữ liệu còn thiếu làm hạn chế phân tích.`;
}

export function marketPrompt(index: any, movers: string, news: any[]): string {
  return `Hôm nay là ${todayVN()}. Viết nhận định thị trường chứng khoán Việt Nam.

## VN-Index
${JSON.stringify(index)}

## Biến động rổ VN30
${movers}

## Tin mới nhất 48 giờ qua
${JSON.stringify(news)}

Yêu cầu: headline 1 câu; summary 1 đoạn 4–6 câu; themes gồm 3–5 chủ đề nổi bật kèm mã liên quan;
watch_list gồm 3–5 điều nhà đầu tư nên theo dõi trong phiên tới.`;
}

export async function generateAiJson(
  config: AiConfig,
  params: {
    system: string;
    prompt: string;
    schema: Record<string, any>;
    schemaName?: string;
  }
): Promise<any> {
  const resp = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: config.providerId,
      baseUrl: config.baseUrl,
      model: config.model,
      apiKey: config.apiKey,
      system: params.system,
      prompt: params.prompt,
      schema: params.schema,
      schemaName: params.schemaName || 'result',
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Lỗi AI (HTTP ${resp.status})`);
  }

  return await resp.json();
}

export async function listAiModels(config: AiConfig): Promise<string[]> {
  const resp = await fetch('/api/ai/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: config.providerId,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${resp.status}`);
  }

  return await resp.json();
}
