/**
 * チャット履歴の自動要約機能
 * Phase 6.2: 要約専用プロンプトとAPI統合
 */

import type { Message } from '@/types/chat';
import type { AIModelId } from '@/types/ai';
import { sendGeminiMessage } from './gemini';
import { sendClaudeMessage } from './claude';

/**
 * 要約専用プロンプト
 * 情報欠落を最小化するため、以下を保持:
 * 1. ユーザーの要望と制約条件
 * 2. 既に決定した内容
 * 3. 重要な提案とフィードバック
 * 4. 文脈情報（計画段階、進捗状況）
 */
const SUMMARY_PROMPT = `以下のチャット履歴を要約してください。

**要約時に必ず含める情報:**
1. **旅行の基本情報**: 目的地、期間、予算、人数
2. **ユーザーの要望と制約**: 特別なリクエスト、避けたいこと、好み
3. **既に決定した内容**: 確定した旅行先、日程、観光スポット、宿泊施設
4. **重要な提案とフィードバック**: AIが提案してユーザーが気に入った内容、却下された提案とその理由
5. **現在の計画段階**: どの段階まで進んでいるか（情報収集中、骨組み作成中、詳細化中など）

**要約形式:**
- 簡潔かつ具体的に
- 箇条書きで構造化
- 重要な数値や固有名詞は省略しない
- 時系列を保持

**チャット履歴:**
`;

/**
 * チャット履歴を要約
 * Gemini Flash（高速・低コスト）を使用
 */
export async function summarizeChatHistory(
  messages: Message[],
  modelId: AIModelId = 'gemini-flash',
  claudeApiKey?: string
): Promise<string> {
  // 要約対象のメッセージをテキストに変換
  const chatText = messages
    .map((msg) => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`)
    .join('\n\n');

  const prompt = `${SUMMARY_PROMPT}\n\n${chatText}`;

  try {
    if (modelId === 'claude' && claudeApiKey) {
      // Claude使用
      const response = await sendClaudeMessage(claudeApiKey, prompt, []);
      return response.message;
    } else {
      // Gemini Flash使用（デフォルト）
      const response = await sendGeminiMessage(
        prompt,
        [],
        undefined,
        undefined,
        'initial',
        null,
        'gemini-flash'
      );
      return response.message;
    }
  } catch (error) {
    console.error('Summarization error:', error);
    // エラー時は簡易要約を返す
    return `過去の会話（${messages.length}件）が要約されました。詳細は省略されています。`;
  }
}

/**
 * 要約結果をassistantメッセージとして生成
 */
export function createSummaryMessage(summary: string): Message {
  return {
    id: `summary-${Date.now()}`,
    role: 'assistant',
    content: `📝 **過去の会話の要約**\n\n${summary}`,
    timestamp: new Date(),
  };
}
