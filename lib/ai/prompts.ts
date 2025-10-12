/**
 * AIプロンプトテンプレート
 */

import type {
  ItineraryData,
  DaySchedule,
  TouristSpot,
} from "@/types/itinerary";
import { generateId } from "@/lib/utils/id-generator";

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
          "location": {
            "lat": 35.6762,
            "lng": 139.6503,
            "address": "東京都〇〇区〇〇"
          },
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
- 実在するスポットには必ず位置情報（緯度・経度）を含めてください
- 地図表示のために正確な座標が重要です
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

/**
 * しおり更新プロンプト
 * 既存のしおりデータを更新する際のプロンプト
 */
export function createUpdatePrompt(currentItinerary: ItineraryData): string {
  return `現在作成中の旅のしおり情報：
タイトル: ${currentItinerary.title}
行き先: ${currentItinerary.destination}
期間: ${currentItinerary.startDate} 〜 ${currentItinerary.endDate} (${
    currentItinerary.duration
  }日間)

現在のスケジュール:
${formatScheduleForPrompt(currentItinerary.schedule)}

ユーザーの要望に応じて、このしおりを更新してください。`;
}

/**
 * スケジュールをプロンプト用にフォーマット
 */
function formatScheduleForPrompt(schedule: DaySchedule[]): string {
  if (!schedule || schedule.length === 0) {
    return "（まだスケジュールが設定されていません）";
  }

  return schedule
    .map((day) => {
      const spots = day.spots
        .map(
          (spot) =>
            `  - ${spot.scheduledTime || "時間未定"}: ${spot.name} (${
              spot.duration || 0
            }分)`
        )
        .join("\n");

      return `【${day.day}日目】 ${day.date || "日付未定"}\n${spots}`;
    })
    .join("\n\n");
}

/**
 * JSON抽出正規表現
 * AIの応答からJSONデータを抽出
 */
export const JSON_EXTRACTION_REGEX = /```json\s*([\s\S]*?)\s*```/;

/**
 * AIの応答をパースして、メッセージとしおりデータに分離
 * BUG-001修正: JSONブロックを完全に削除してクリーンなメッセージを返す
 */
export function parseAIResponse(response: string): {
  message: string;
  itineraryData: Partial<ItineraryData> | null;
} {
  // すべてのJSONブロックを検出（グローバルフラグ付き）
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
  const matches = Array.from(response.matchAll(jsonBlockRegex));

  if (matches.length === 0) {
    // JSONが含まれていない場合は、メッセージのみ
    return {
      message: response.trim(),
      itineraryData: null,
    };
  }

  // 最初のJSONブロックからしおりデータを抽出
  let itineraryData: Partial<ItineraryData> | null = null;

  try {
    const firstMatch = matches[0];
    const jsonString = firstMatch[1];
    itineraryData = JSON.parse(jsonString) as Partial<ItineraryData>;
  } catch (error) {
    console.error("Failed to parse itinerary JSON:", error);
    // パースに失敗した場合はJSONを削除せずに元のメッセージを返す
    return {
      message: response.trim(),
      itineraryData: null,
    };
  }

  // すべてのJSONブロックをメッセージから削除
  let message = response;
  for (const match of matches) {
    message = message.replace(match[0], "");
  }

  // 余分な空白・改行を整理
  message = message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();

  // メッセージが空の場合はデフォルトメッセージを設定
  if (!message) {
    message = "しおりを更新しました。";
  }

  return {
    message,
    itineraryData,
  };
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
    id: generateId(),
    title: "新しい旅のしおり",
    destination: "",
    schedule: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  // スケジュールのマージ処理
  let mergedSchedule = baseData.schedule;
  if (updates.schedule) {
    mergedSchedule = updates.schedule.map((newDay, index) => {
      const existingDay = baseData.schedule[index];

      // スポットにIDを付与（なければ）
      const spots = newDay.spots.map((spot) => ({
        ...spot,
        id: spot.id || generateId(),
      }));

      return {
        ...existingDay,
        ...newDay,
        id: newDay.id || existingDay?.id || generateId(), // DayScheduleにもIDを付与
        spots,
      };
    });
  }

  // 日付フィールドを常にDateオブジェクトに変換
  // APIレスポンスでは文字列になっている可能性があるため
  const createdAt = updates.createdAt
    ? updates.createdAt instanceof Date
      ? updates.createdAt
      : new Date(updates.createdAt)
    : baseData.createdAt;

  const publishedAt = updates.publishedAt
    ? updates.publishedAt instanceof Date
      ? updates.publishedAt
      : new Date(updates.publishedAt)
    : baseData.publishedAt;

  return {
    ...baseData,
    ...updates,
    schedule: mergedSchedule,
    createdAt,
    updatedAt: now,
    publishedAt,
  };
}

/**
 * チャット履歴をプロンプト用にフォーマット
 */
export function formatChatHistory(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((msg) => {
      const role = msg.role === "user" ? "ユーザー" : "アシスタント";
      return `${role}: ${msg.content}`;
    })
    .join("\n\n");
}

/**
 * エラーメッセージの生成
 */
export function generateErrorMessage(error: any): string {
  if (error.message?.includes("API key")) {
    return "申し訳ございません。APIキーの設定に問題があるようです。設定をご確認ください。";
  }

  if (error.message?.includes("rate limit")) {
    return "申し訳ございません。現在アクセスが集中しております。少し時間をおいて再度お試しください。";
  }

  return "申し訳ございません。エラーが発生しました。もう一度お試しいただくか、別の表現で質問してみてください。";
}

// ============================================================================
// Phase 4: 段階的旅程構築システム用のプロンプト関数
// ============================================================================

/**
 * Phase 4.3: 骨組み作成用プロンプト
 * 基本情報から各日の大まかなテーマ・エリアを決定する
 */
export function createSkeletonPrompt(itinerary: ItineraryData): string {
  const { destination, duration, summary } = itinerary;

  return `【骨組み作成フェーズ】
ユーザーから以下の基本情報を受け取りました：
- 行き先: ${destination}
- 期間: ${duration}日間
- 旅行の概要: ${summary || "（未設定）"}

次のステップとして、各日の**大まかなテーマ・エリア**を提案してください。

【注意事項】
- 具体的な観光スポット名は**まだ出さない**でください
- 各日のテーマ・エリアのみを提案（例: "浅草・スカイツリー周辺", "渋谷・原宿エリア"）
- 移動の効率や観光の流れを考慮
- 各日のコンセプトが明確になるように

【出力形式】
まず、各日のテーマを自然な会話形式で説明し、その後JSONで骨組みデータを出力してください。
JSONには以下を含めてください：
- phase: "skeleton"
- schedule: 各日のday, title, theme, status: "skeleton", spots: []

例:
「${destination}の${duration}日間の旅程を考えてみました。

1日目は○○エリアを中心に...
2日目は△△エリアを...

このような流れでいかがでしょうか？」

\`\`\`json
{
  "phase": "skeleton",
  "schedule": [...]
}
\`\`\``;
}

/**
 * Phase 4.3: 日程詳細化用プロンプト
 * 指定された日の具体的な観光スポット、時間、移動手段を作成
 */
export function createDayDetailPrompt(
  itinerary: ItineraryData,
  targetDay: number
): string {
  // 安全性チェック: scheduleが存在しない場合の対応
  if (!itinerary || !itinerary.schedule || itinerary.schedule.length === 0) {
    console.warn(
      `createDayDetailPrompt: Invalid itinerary for day ${targetDay}`
    );
    return `【日程詳細化フェーズ】\n${targetDay}日目の詳細を作成してください。`;
  }

  const daySchedule = itinerary.schedule.find((d) => d.day === targetDay);
  const theme = daySchedule?.theme || `${targetDay}日目`;

  return `【日程詳細化フェーズ】
現在、${targetDay}日目の詳細を作成しています。

【${targetDay}日目の骨組み】
- テーマ: ${theme}
- タイトル: ${daySchedule?.title || "（未設定）"}

【他の日の情報（参考）】
${formatScheduleForPrompt(itinerary.schedule)}

【タスク】
${targetDay}日目の具体的なスケジュールを作成してください：
1. **実在する観光スポット**を提案
2. **位置情報**（location）を設定（緯度・経度、住所）
3. **訪問時刻**（scheduledTime）を設定（HH:mm形式）
4. **滞在時間**（duration、分単位）を現実的に設定
5. **移動時間**を考慮
6. **食事の時間**を適切に確保
7. **カテゴリ**（sightseeing, dining, transportation等）を指定
8. **概算費用**（estimatedCost、円）を設定

【出力形式】
まず、${targetDay}日目のスケジュールを自然な会話形式で説明し、その後JSONで詳細データを出力してください。
JSONには以下を含めてください：
- phase: "detailing"
- currentDay: ${targetDay}
- schedule: ${targetDay}日目の詳細なspots配列を含む
- その日のstatus: "detailed"

例:
「${targetDay}日目は${theme}を楽しむプランを考えました。

午前中は○○を訪れ、その後...」

\`\`\`json
{
  "phase": "detailing",
  "currentDay": ${targetDay},
  "schedule": [...]
}
\`\`\``;
}

/**
 * Phase 4.3: フェーズに応じたシステムプロンプトを選択
 */
export function getSystemPromptForPhase(): string {
  // Phase 4の段階的構築システムが廃止されたため、常に通常のシステムプロンプトを返す
  return SYSTEM_PROMPT;
}
