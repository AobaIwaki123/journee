import type { Message } from '@/types/chat';

/**
 * トークン数の推定（GPT-3/4のトークナイザー相当）
 * 日本語: 約1文字=2トークン
 * 英語: 約1単語=1.3トークン
 */
export function estimateTokens(text: string): number {
  // 簡易推定: 文字数 * 2（日本語が多い想定）
  return Math.ceil(text.length * 2);
}

/**
 * チャット履歴の総トークン数を計算
 */
export function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
}

/**
 * トークン制限内に収める
 * Gemini: 100万トークン
 * Claude: 20万トークン
 */
export function limitChatHistoryByTokens(
  messages: Message[],
  maxTokens: number = 100000 // デフォルト: 10万トークン
): Message[] {
  const result: Message[] = [];
  let currentTokens = 0;

  // 最新メッセージから逆順で追加
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (currentTokens + msgTokens > maxTokens) {
      break; // トークン制限に達したら終了
    }

    result.unshift(msg);
    currentTokens += msgTokens;
  }

  return result;
}

/**
 * 要約が必要か判定（閾値: 5万トークン）
 */
export function shouldSummarize(messages: Message[]): boolean {
  const totalTokens = calculateTotalTokens(messages);
  return totalTokens > 50000;
}

/**
 * 要約対象のメッセージ範囲を決定
 * - 最新10件は残す
 * - それより前を要約対象とする
 */
export function getSummaryRange(messages: Message[]): { start: number; end: number } {
  if (messages.length <= 10) {
    return { start: 0, end: 0 }; // 要約不要
  }

  return {
    start: 0,
    end: messages.length - 10, // 最新10件を除く
  };
}
