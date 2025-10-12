/**
 * チャット履歴の圧縮（要約）機能
 * Phase 6.3: チャット履歴を要約してトークン数を削減
 */

import type { Message } from '@/types/chat';
import type { AIModelId } from '@/types/ai';
import { shouldSummarize, getSummaryRange, calculateTotalTokens } from './token-manager';
import { summarizeChatHistory, createSummaryMessage } from './summarizer';

/**
 * チャット履歴を圧縮（要約）
 *
 * 動作:
 * 1. トークン数が閾値（5万）を超えたら要約トリガー
 * 2. 最新N件（10件）を残し、それより前を要約
 * 3. 要約結果を1つのメッセージに圧縮
 * 4. [要約メッセージ, 最新N件] の構成で返す
 */
export async function compressChatHistory(
  messages: Message[],
  modelId: AIModelId,
  claudeApiKey?: string
): Promise<{ compressed: Message[]; didCompress: boolean }> {
  // 要約が必要かチェック
  if (!shouldSummarize(messages)) {
    return { compressed: messages, didCompress: false };
  }

  // 要約対象範囲を取得
  const { start, end } = getSummaryRange(messages);

  if (end <= start) {
    return { compressed: messages, didCompress: false };
  }

  try {
    // 要約対象のメッセージ
    const toSummarize = messages.slice(start, end);
    const recentMessages = messages.slice(end);

    console.log(`Summarizing ${toSummarize.length} messages (keeping ${recentMessages.length} recent)`);

    // 要約実行
    const summary = await summarizeChatHistory(toSummarize, modelId, claudeApiKey);
    const summaryMessage = createSummaryMessage(summary);

    // 圧縮後のメッセージリスト
    const compressed = [summaryMessage, ...recentMessages];

    console.log(`Compression complete. Total tokens: ${calculateTotalTokens(messages)} → ${calculateTotalTokens(compressed)}`);

    return { compressed, didCompress: true };
  } catch (error) {
    console.error('Compression failed:', error);
    // エラー時は圧縮せずに返す
    return { compressed: messages, didCompress: false };
  }
}
