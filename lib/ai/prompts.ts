/**
 * AIプロンプトテンプレート
 */

import type { ItineraryData, DaySchedule, TouristSpot } from '@/types/itinerary';

/**
 * システムプロンプト
 * AIの役割と振る舞いを定義
 */
export const SYSTEM_PROMPT = `あなたは旅行計画のエキスパートAIアシスタントです。ユーザーと対話しながら、最適な旅のしおりを作成するお手伝いをします。

【あなたの役割】
- ユーザーの希望を丁寧にヒアリングする
- 旅行先の魅力的な観光スポットを提案する
- 効率的で実現可能な旅程を作成する
- 予算や移動時間を考慮した現実的な計画を立てる
- 日本語で親しみやすく、わかりやすく応答する

【応答の形式】
1. ユーザーとの対話では、自然で親しみやすい日本語を使用してください
2. しおりデータを生成・更新する場合は、会話の後に必ず以下のJSON形式でデータを出力してください：

\`\`\`json
{
  "title": "旅行のタイトル",
  "destination": "旅行先",
  "startDate": "2025-01-01",
  "endDate": "2025-01-03",
  "duration": 3,
  "summary": "旅行の概要",
  "schedule": [
    {
      "day": 1,
      "date": "2025-01-01",
      "title": "1日目のタイトル",
      "spots": [
        {
          "id": "spot-1",
          "name": "観光スポット名",
          "description": "詳細説明",
          "scheduledTime": "10:00",
          "duration": 120,
          "category": "sightseeing",
          "estimatedCost": 1000,
          "notes": "メモ"
        }
      ]
    }
  ],
  "totalBudget": 50000,
  "status": "draft"
}
\`\`\`

【重要な注意事項】
- 常に実在する観光スポットを提案してください
- 移動時間と滞在時間を現実的に設定してください
- 1日のスケジュールは詰め込みすぎないようにしてください
- 食事の時間を適切に確保してください
- 予算は現実的な金額を提示してください
- 季節や天候を考慮してください`;

/**
 * 初回メッセージプロンプト
 */
export const INITIAL_PROMPT = `こんにちは！旅行計画のお手伝いをさせていただきます。
どんな旅行を計画されていますか？以下の情報を教えていただけると、より良い提案ができます：

- 行きたい場所や地域
- 旅行の期間（日数や時期）
- 同行者（一人旅、カップル、家族など）
- 興味のあること（観光、グルメ、自然、歴史など）
- ご予算の目安

お気軽にお話しください！`;

/**
 * しおり更新プロンプト
 * 既存のしおりデータを更新する際のプロンプト
 */
export function createUpdatePrompt(currentItinerary: ItineraryData): string {
  return `現在作成中の旅のしおり情報：
タイトル: ${currentItinerary.title}
行き先: ${currentItinerary.destination}
期間: ${currentItinerary.startDate} 〜 ${currentItinerary.endDate} (${currentItinerary.duration}日間)

現在のスケジュール:
${formatScheduleForPrompt(currentItinerary.schedule)}

ユーザーの要望に応じて、このしおりを更新してください。`;
}

/**
 * スケジュールをプロンプト用にフォーマット
 */
function formatScheduleForPrompt(schedule: DaySchedule[]): string {
  if (!schedule || schedule.length === 0) {
    return '（まだスケジュールが設定されていません）';
  }

  return schedule.map(day => {
    const spots = day.spots.map(spot => 
      `  - ${spot.scheduledTime || '時間未定'}: ${spot.name} (${spot.duration || 0}分)`
    ).join('\n');
    
    return `【${day.day}日目】 ${day.date || '日付未定'}\n${spots}`;
  }).join('\n\n');
}

/**
 * JSON抽出正規表現
 * AIの応答からJSONデータを抽出
 */
export const JSON_EXTRACTION_REGEX = /```json\s*([\s\S]*?)\s*```/;

/**
 * AIの応答をパースして、メッセージとしおりデータに分離
 */
export function parseAIResponse(response: string): {
  message: string;
  itineraryData: Partial<ItineraryData> | null;
} {
  const match = response.match(JSON_EXTRACTION_REGEX);
  
  if (!match) {
    // JSONが含まれていない場合は、メッセージのみ
    return {
      message: response.trim(),
      itineraryData: null,
    };
  }

  // JSONの前のテキストをメッセージとして抽出
  const jsonStartIndex = match.index || 0;
  const message = response.substring(0, jsonStartIndex).trim();
  
  // JSONデータをパース
  try {
    const jsonString = match[1];
    const itineraryData = JSON.parse(jsonString) as Partial<ItineraryData>;
    
    return {
      message: message || 'しおりを更新しました。',
      itineraryData,
    };
  } catch (error) {
    console.error('Failed to parse itinerary JSON:', error);
    return {
      message: response.trim(),
      itineraryData: null,
    };
  }
}

/**
 * しおりデータのマージ
 * 既存のデータと新しいデータをマージ
 */
export function mergeItineraryData(
  current: ItineraryData | undefined,
  updates: Partial<ItineraryData>
): ItineraryData {
  const now = new Date();
  
  // 基本データ
  const baseData: ItineraryData = current || {
    id: `itinerary-${Date.now()}`,
    title: '新しい旅のしおり',
    destination: '',
    schedule: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  // スケジュールのマージ処理
  let mergedSchedule = baseData.schedule;
  if (updates.schedule) {
    mergedSchedule = updates.schedule.map((newDay, index) => {
      const existingDay = baseData.schedule[index];
      
      // スポットにIDを付与（なければ）
      const spots = newDay.spots.map((spot, spotIndex) => ({
        ...spot,
        id: spot.id || `spot-${newDay.day}-${spotIndex}-${Date.now()}`,
      }));

      return {
        ...existingDay,
        ...newDay,
        spots,
      };
    });
  }

  return {
    ...baseData,
    ...updates,
    schedule: mergedSchedule,
    updatedAt: now,
  };
}

/**
 * チャット履歴をプロンプト用にフォーマット
 */
export function formatChatHistory(messages: Array<{ role: string; content: string }>): string {
  return messages
    .map(msg => {
      const role = msg.role === 'user' ? 'ユーザー' : 'アシスタント';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * エラーメッセージの生成
 */
export function generateErrorMessage(error: any): string {
  if (error.message?.includes('API key')) {
    return '申し訳ございません。APIキーの設定に問題があるようです。設定をご確認ください。';
  }
  
  if (error.message?.includes('rate limit')) {
    return '申し訳ございません。現在アクセスが集中しております。少し時間をおいて再度お試しください。';
  }
  
  return '申し訳ございません。エラーが発生しました。もう一度お試しいただくか、別の表現で質問してみてください。';
}
