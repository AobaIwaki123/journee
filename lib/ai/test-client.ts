/**
 * Gemini APIクライアントのテストスクリプト
 * 
 * 使用方法:
 * 1. .env.localにGEMINI_API_KEYを設定
 * 2. このスクリプトを実行: npx tsx lib/ai/test-client.ts
 */

import { sendGeminiMessage, streamGeminiMessage } from './gemini';
import type { ChatMessage } from '@/types/chat';

/**
 * 非ストリーミングテスト
 */
async function testNonStreaming() {
  console.log('=== 非ストリーミングテスト ===\n');

  try {
    const result = await sendGeminiMessage(
      '東京で3日間の旅行計画を立てたいです。浅草、スカイツリー、渋谷を回りたいです。',
      [],
      undefined
    );

    console.log('AIの応答:');
    console.log(result.message);
    console.log('\n生成されたしおり:');
    console.log(JSON.stringify(result.itinerary, null, 2));
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * ストリーミングテスト
 */
async function testStreaming() {
  console.log('\n\n=== ストリーミングテスト ===\n');

  try {
    let fullResponse = '';
    
    for await (const chunk of streamGeminiMessage(
      '京都で2日間の旅行計画を立てたいです。清水寺、金閣寺、嵐山を回りたいです。',
      [],
      undefined
    )) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n\n完了！');
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * チャット履歴を含むテスト
 */
async function testWithHistory() {
  console.log('\n\n=== チャット履歴を含むテスト ===\n');

  const chatHistory: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: '北海道に行きたいです',
      timestamp: new Date(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '北海道、素敵ですね！何日間の旅行を予定されていますか？',
      timestamp: new Date(),
    },
  ];

  try {
    const result = await sendGeminiMessage(
      '3日間で札幌と小樽を回りたいです',
      chatHistory,
      undefined
    );

    console.log('AIの応答:');
    console.log(result.message);
    console.log('\n生成されたしおり:');
    console.log(JSON.stringify(result.itinerary, null, 2));
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * しおり更新テスト
 */
async function testItineraryUpdate() {
  console.log('\n\n=== しおり更新テスト ===\n');

  const currentItinerary = {
    id: 'itinerary-123',
    title: '大阪2日間の旅',
    destination: '大阪',
    startDate: '2025-11-01',
    endDate: '2025-11-02',
    duration: 2,
    schedule: [
      {
        day: 1,
        date: '2025-11-01',
        title: '1日目: 大阪城・道頓堀',
        spots: [
          {
            id: 'spot-1',
            name: '大阪城',
            description: '豊臣秀吉が築いた名城',
            scheduledTime: '10:00',
            duration: 120,
            category: 'sightseeing' as const,
            estimatedCost: 600,
          },
        ],
      },
    ],
    status: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await sendGeminiMessage(
      '2日目にユニバーサルスタジオジャパンを追加してください',
      [],
      currentItinerary
    );

    console.log('AIの応答:');
    console.log(result.message);
    console.log('\n更新されたしおり:');
    console.log(JSON.stringify(result.itinerary, null, 2));
  } catch (error) {
    console.error('エラー:', error);
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('Gemini APIクライアントテスト\n');
  console.log('環境変数チェック:');
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '設定済み ✓' : '未設定 ✗'}\n`);

  if (!process.env.GEMINI_API_KEY) {
    console.error('エラー: GEMINI_API_KEYが設定されていません。');
    console.error('.env.localファイルにGEMINI_API_KEYを設定してください。');
    process.exit(1);
  }

  // テストを順番に実行
  await testNonStreaming();
  await new Promise(resolve => setTimeout(resolve, 2000)); // レート制限対策

  await testStreaming();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testWithHistory();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testItineraryUpdate();

  console.log('\n\nすべてのテストが完了しました！');
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}
