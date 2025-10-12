/**
 * AI関連の型定義
 */

/**
 * サポートされているAIモデルのID
 */
export type AIModelId = 'gemini-pro' | 'gemini-flash' | 'claude';

/**
 * AIモデルプロバイダー
 */
export type AIProvider = 'google' | 'anthropic';

/**
 * AIモデルの設定
 */
export interface AIModelConfig {
  /** モデルID（内部識別子） */
  id: AIModelId;
  /** 表示名 */
  displayName: string;
  /** モデル名（API呼び出し用） */
  modelName: string;
  /** プロバイダー */
  provider: AIProvider;
  /** 説明 */
  description?: string;
  /** APIキーが必要か */
  requiresApiKey: boolean;
  /** APIキーの取得方法URL */
  apiKeyUrl?: string;
  /** デフォルトの最大トークン数 */
  maxTokens?: number;
  /** 有効かどうか */
  enabled: boolean;
  /** アイコン */
  icon?: string;
}

/**
 * AIモデルの機能
 */
export interface AIModelCapabilities {
  /** ストリーミング対応 */
  streaming: boolean;
  /** 関数呼び出し対応 */
  functionCalling: boolean;
  /** ビジョン対応 */
  vision: boolean;
  /** JSON mode対応 */
  jsonMode: boolean;
}

/**
 * AIモデルのコスト情報
 */
export interface AIModelPricing {
  /** 入力トークンあたりの価格（USD） */
  inputPerToken: number;
  /** 出力トークンあたりの価格（USD） */
  outputPerToken: number;
  /** 通貨 */
  currency: string;
}