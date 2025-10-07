/**
 * parseAIResponse 関数のテスト
 * Phase 3.5 - JSON削除バグ修正のテストケース
 */

import { parseAIResponse } from '../prompts';

describe('parseAIResponse', () => {
  test('JSONブロックを含むレスポンスから、メッセージ部分のみ抽出', () => {
    const response = `素敵な旅行プランを作成しました！京都の魅力を満喫できる3日間の旅程です。

\`\`\`json
{
  "title": "京都3日間の旅",
  "destination": "京都",
  "duration": 3
}
\`\`\``;

    const result = parseAIResponse(response);
    
    expect(result.message).toBe('素敵な旅行プランを作成しました！京都の魅力を満喫できる3日間の旅程です。');
    expect(result.message).not.toContain('```json');
    expect(result.message).not.toContain('```');
    expect(result.itineraryData).toEqual({
      title: '京都3日間の旅',
      destination: '京都',
      duration: 3,
    });
  });

  test('JSONブロックのみのレスポンス（メッセージなし）', () => {
    const response = `\`\`\`json
{
  "title": "東京観光",
  "destination": "東京"
}
\`\`\``;

    const result = parseAIResponse(response);
    
    expect(result.message).toBe('しおりを更新しました。ご確認ください。');
    expect(result.message).not.toContain('```json');
    expect(result.itineraryData).toEqual({
      title: '東京観光',
      destination: '東京',
    });
  });

  test('複数のJSONブロックを含むレスポンス', () => {
    const response = `最初のプランです。

\`\`\`json
{
  "title": "プラン1"
}
\`\`\`

こちらも検討してみてください。

\`\`\`json
{
  "title": "プラン2"
}
\`\`\``;

    const result = parseAIResponse(response);
    
    // 最初のJSONブロックを抽出
    expect(result.itineraryData).toEqual({
      title: 'プラン1',
    });
    
    // すべてのJSONブロックがメッセージから削除される
    expect(result.message).not.toContain('```json');
    expect(result.message).not.toContain('```');
    expect(result.message).toContain('最初のプランです。');
    expect(result.message).toContain('こちらも検討してみてください。');
  });

  test('JSONブロックが含まれないレスポンス', () => {
    const response = 'どんな旅行を計画されていますか？詳しく教えてください。';

    const result = parseAIResponse(response);
    
    expect(result.message).toBe('どんな旅行を計画されていますか？詳しく教えてください。');
    expect(result.itineraryData).toBeNull();
  });

  test('不正なJSON形式の場合', () => {
    const response = `旅行プランを作成しました。

\`\`\`json
{
  "title": "invalid json
  "destination": "Tokyo"
}
\`\`\``;

    const result = parseAIResponse(response);
    
    // JSON解析に失敗してもJSONブロックは削除される
    expect(result.message).toBe('旅行プランを作成しました。');
    expect(result.message).not.toContain('```json');
    expect(result.itineraryData).toBeNull();
  });

  test('JSONブロックの前後にメッセージがあるケース', () => {
    const response = `こちらが提案プランです。

\`\`\`json
{
  "title": "北海道の旅",
  "destination": "北海道"
}
\`\`\`

いかがでしょうか？`;

    const result = parseAIResponse(response);
    
    expect(result.message).toContain('こちらが提案プランです。');
    expect(result.message).toContain('いかがでしょうか？');
    expect(result.message).not.toContain('```json');
    expect(result.message).not.toContain('```');
    expect(result.itineraryData).toEqual({
      title: '北海道の旅',
      destination: '北海道',
    });
  });

  test('余分な空白・改行が削除されること', () => {
    const response = `  

プランを作成しました。


\`\`\`json
{
  "title": "沖縄の旅"
}
\`\`\`


  `;

    const result = parseAIResponse(response);
    
    expect(result.message).toBe('プランを作成しました。');
    expect(result.message).not.toMatch(/^\s+/);
    expect(result.message).not.toMatch(/\s+$/);
  });

  test('3つ以上連続する改行が2つに整形されること', () => {
    const response = `タイトルです。



内容です。

\`\`\`json
{
  "title": "test"
}
\`\`\``;

    const result = parseAIResponse(response);
    
    expect(result.message).toBe('タイトルです。\n\n内容です。');
    expect(result.message).not.toContain('\n\n\n');
  });
});