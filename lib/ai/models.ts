/**
 * AIモデル設定の一元管理
 * 
 * すべてのAIモデルに関する設定をここで管理します。
 * モデル名のハードコーディングを避け、型安全な実装を実現します。
 */

import type { AIModelId, AIModelConfig } from '@/types/ai';

/**
 * AIモデル設定マップ
 */
export const AI_MODELS: Record<AIModelId, AIModelConfig> = {
  gemini: {
    id: 'gemini',
    displayName: 'Gemini 2.0 Flash',
    modelName: 'gemini-2.0-flash-exp',
    provider: 'google',
    description: 'Googleの最新AI。高速で安価、環境変数で設定済み',
    requiresApiKey: false,
    maxTokens: 8192,
    enabled: true,
    icon: '🤖',
  },
  claude: {
    id: 'claude',
    displayName: 'Claude 3.5 Sonnet',
    modelName: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    description: 'Anthropicの高性能AI。要APIキー登録',
    requiresApiKey: true,
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    maxTokens: 4096,
    enabled: true,
    icon: '🧠',
  },
} as const;

/**
 * デフォルトのAIモデル
 */
export const DEFAULT_AI_MODEL: AIModelId = 'gemini';

/**
 * サポートされているAIモデルのIDリスト
 */
export const SUPPORTED_AI_MODELS: readonly AIModelId[] = Object.keys(
  AI_MODELS
) as AIModelId[];

/**
 * 有効なAIモデルのリストを取得
 */
export function getEnabledModels(): AIModelConfig[] {
  return SUPPORTED_AI_MODELS.filter((id) => AI_MODELS[id].enabled).map(
    (id) => AI_MODELS[id]
  );
}

/**
 * モデルIDからモデル設定を取得
 */
export function getModelConfig(modelId: AIModelId): AIModelConfig {
  return AI_MODELS[modelId];
}

/**
 * モデル表示名を取得
 */
export function getModelDisplayName(modelId: AIModelId): string {
  return AI_MODELS[modelId].displayName;
}

/**
 * モデル名（API用）を取得
 */
export function getModelName(modelId: AIModelId): string {
  return AI_MODELS[modelId].modelName;
}

/**
 * モデルがAPIキーを必要とするか確認
 */
export function requiresApiKey(modelId: AIModelId): boolean {
  return AI_MODELS[modelId].requiresApiKey;
}

/**
 * モデルが有効か確認
 */
export function isModelEnabled(modelId: AIModelId): boolean {
  return AI_MODELS[modelId].enabled;
}

/**
 * APIキー取得URLを取得
 */
export function getApiKeyUrl(modelId: AIModelId): string | undefined {
  return AI_MODELS[modelId].apiKeyUrl;
}

/**
 * モデルIDの検証
 */
export function isValidModelId(id: string): id is AIModelId {
  return SUPPORTED_AI_MODELS.includes(id as AIModelId);
}