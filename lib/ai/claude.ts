/**
 * Claude API統合
 * Anthropic Claude APIとの通信を管理
 * 
 * Phase 6.1: APIキー検証機能のみ実装
 * Phase 6.2: 完全なClaude API統合（ストリーミング対応）
 */

/**
 * Claude APIキーを検証
 * 実際のAPI呼び出しを行い、キーの有効性を確認
 */
export async function validateClaudeApiKey(apiKey: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      isValid: false,
      error: 'APIキーが空です',
    };
  }

  // APIキーの形式を簡易的にチェック
  // Claudeのキーは通常 "sk-ant-" で始まる
  if (!apiKey.startsWith('sk-ant-')) {
    return {
      isValid: false,
      error: 'Claude APIキーは "sk-ant-" で始まる必要があります',
    };
  }

  // 長さチェック（Claudeのキーは通常100文字以上）
  if (apiKey.length < 50) {
    return {
      isValid: false,
      error: 'APIキーが短すぎます',
    };
  }

  // Phase 6.2で実装: 実際のAPI呼び出しによる検証
  // 現時点では形式チェックのみ
  try {
    // TODO: Phase 6.2で実装
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': apiKey,
    //     'anthropic-version': '2023-06-01',
    //     'content-type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-3-5-sonnet-20241022',
    //     max_tokens: 10,
    //     messages: [{ role: 'user', content: 'test' }],
    //   }),
    // });
    //
    // if (!response.ok) {
    //   const error = await response.json();
    //   return {
    //     isValid: false,
    //     error: error.error?.message || 'APIキーが無効です',
    //   };
    // }

    // 暫定的に形式チェックのみでOKとする
    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'APIキーの検証に失敗しました',
    };
  }
}

/**
 * Claude APIでチャットメッセージを送信（Phase 6.2で実装予定）
 */
export async function sendClaudeMessage(
  apiKey: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  // Phase 6.2で実装
  throw new Error('Claude API統合はPhase 6.2で実装予定です');
}

/**
 * Claude APIでストリーミングチャットを送信（Phase 6.2で実装予定）
 */
export async function* sendClaudeMessageStream(
  apiKey: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): AsyncGenerator<string> {
  // Phase 6.2で実装
  throw new Error('Claude API統合はPhase 6.2で実装予定です');
}