import { describe, it, expect } from 'vitest';
import {
  parseAIResponse,
  mergeItineraryData,
  formatChatHistory,
  generateErrorMessage,
} from '@/lib/ai/prompts';
import type { ItineraryData } from '@/types/itinerary';

describe('parseAIResponse', () => {
  it('should extract JSON and text from response with single JSON block', () => {
    const response = 'こんにちは！旅のしおりを作成しました。\n```json\n{"title":"テスト旅行"}\n```';
    const result = parseAIResponse(response);
    
    expect(result.itineraryData).toEqual({ title: 'テスト旅行' });
    expect(result.message).toBe('こんにちは！旅のしおりを作成しました。');
  });

  it('should handle multiple JSON blocks and extract first one', () => {
    const response = `
テキスト1
\`\`\`json
{"title":"旅行1"}
\`\`\`
テキスト2
\`\`\`json
{"title":"旅行2"}
\`\`\`
`;
    const result = parseAIResponse(response);
    
    expect(result.itineraryData).toEqual({ title: '旅行1' });
    expect(result.message).not.toContain('```json');
    expect(result.message).toContain('テキスト1');
    expect(result.message).toContain('テキスト2');
  });

  it('should return null itineraryData when no JSON found', () => {
    const response = 'これは普通のテキストです';
    const result = parseAIResponse(response);
    
    expect(result.itineraryData).toBeNull();
    expect(result.message).toBe('これは普通のテキストです');
  });

  it('should handle malformed JSON gracefully', () => {
    const response = 'テキスト\n```json\n{invalid json}\n```';
    const result = parseAIResponse(response);
    
    // パースエラー時は元のメッセージを保持
    expect(result.itineraryData).toBeNull();
    expect(result.message).toBeTruthy();
  });

  it('should trim whitespace from extracted message', () => {
    const response = '\n\n  テキスト  \n\n```json\n{"title":"test"}\n```\n\n';
    const result = parseAIResponse(response);
    
    expect(result.message).toBe('テキスト');
  });

  it('should use default message when text is empty after JSON removal', () => {
    const response = '```json\n{"title":"test"}\n```';
    const result = parseAIResponse(response);
    
    expect(result.message).toBe('しおりを更新しました。');
  });

  it('should handle complex nested JSON', () => {
    const complexJson = {
      title: '東京旅行',
      schedule: [
        {
          day: 1,
          spots: [
            { id: 'spot-1', name: '浅草寺' }
          ]
        }
      ]
    };
    const response = `旅程を作成しました！\n\`\`\`json\n${JSON.stringify(complexJson)}\n\`\`\``;
    const result = parseAIResponse(response);
    
    expect(result.itineraryData).toEqual(complexJson);
    expect(result.message).toBe('旅程を作成しました！');
  });
});

describe('mergeItineraryData', () => {
  const now = new Date();
  const baseItinerary: ItineraryData = {
    id: 'test-1',
    title: '既存の旅行',
    destination: '東京',
    schedule: [
      {
        day: 1,
        spots: [
          { id: 'spot-1', name: '浅草寺', description: '東京の寺院', category: 'sightseeing' }
        ]
      }
    ],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  it('should merge updates into existing itinerary', () => {
    const updates = {
      title: '更新された旅行',
      destination: '大阪',
    };
    
    const result = mergeItineraryData(baseItinerary, updates);
    
    expect(result.title).toBe('更新された旅行');
    expect(result.destination).toBe('大阪');
    expect(result.id).toBe('test-1'); // IDは保持
    expect(result.schedule).toEqual(baseItinerary.schedule); // scheduleも保持
  });

  it('should create new itinerary when current is undefined', () => {
    const updates = {
      title: '新しい旅行',
      destination: '京都',
    };
    
    const result = mergeItineraryData(undefined, updates);
    
    expect(result.title).toBe('新しい旅行');
    expect(result.destination).toBe('京都');
    expect(result.id).toMatch(/^itinerary-\d+$/);
    expect(result.status).toBe('draft');
  });

  it('should merge schedule and add IDs to spots without ID', () => {
    const updates = {
      schedule: [
        {
          day: 1,
          spots: [
            { id: '', name: '金閣寺', description: '金色の寺', category: 'sightseeing' as const }
          ]
        }
      ]
    };
    
    const result = mergeItineraryData(baseItinerary, updates);
    
    expect(result.schedule[0].spots[0]).toHaveProperty('id');
    expect(result.schedule[0].spots[0].name).toBe('金閣寺');
  });

  it('should preserve spot IDs when they exist', () => {
    const updates: Partial<ItineraryData> = {
      schedule: [
        {
          day: 1,
          spots: [
            { id: 'existing-id', name: '伏見稲荷', description: '千本鳥居', category: 'sightseeing' }
          ]
        }
      ]
    };
    
    const result = mergeItineraryData(baseItinerary, updates);
    
    expect(result.schedule[0].spots[0].id).toBe('existing-id');
  });

  it('should update updatedAt timestamp', () => {
    const oldDate = new Date('2020-01-01');
    const oldItinerary = { ...baseItinerary, updatedAt: oldDate };
    
    const result = mergeItineraryData(oldItinerary, { title: '更新' });
    
    expect(result.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
  });
});

describe('formatChatHistory', () => {
  it('should format messages with Japanese labels', () => {
    const messages = [
      { role: 'user', content: 'こんにちは' },
      { role: 'assistant', content: 'はい、こんにちは！' },
    ];
    
    const result = formatChatHistory(messages);
    
    expect(result).toContain('ユーザー: こんにちは');
    expect(result).toContain('アシスタント: はい、こんにちは！');
  });

  it('should separate messages with double newlines', () => {
    const messages = [
      { role: 'user', content: 'メッセージ1' },
      { role: 'assistant', content: 'メッセージ2' },
    ];
    
    const result = formatChatHistory(messages);
    
    expect(result).toMatch(/メッセージ1\n\nアシスタント/);
  });

  it('should handle empty array', () => {
    const result = formatChatHistory([]);
    
    expect(result).toBe('');
  });
});

describe('generateErrorMessage', () => {
  it('should return API key error message', () => {
    const error = new Error('API key is invalid');
    const result = generateErrorMessage(error);
    
    expect(result).toContain('APIキーの設定');
  });

  it('should return rate limit error message', () => {
    const error = new Error('rate limit exceeded');
    const result = generateErrorMessage(error);
    
    expect(result).toContain('アクセスが集中');
  });

  it('should return generic error message for unknown errors', () => {
    const error = new Error('Unknown error');
    const result = generateErrorMessage(error);
    
    expect(result).toContain('エラーが発生しました');
  });

  it('should handle non-Error objects', () => {
    const error = { message: 'Something went wrong' };
    const result = generateErrorMessage(error);
    
    expect(result).toBeTruthy();
  });
});