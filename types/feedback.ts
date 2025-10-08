/**
 * フィードバックシステムの型定義
 */

// フィードバックカテゴリ
export type FeedbackCategory = 
  | 'bug'           // バグ報告
  | 'feature'       // 機能リクエスト
  | 'ui-ux'         // UI/UX改善
  | 'performance'   // パフォーマンス
  | 'content'       // コンテンツ（プロンプト、テキスト）
  | 'other';        // その他

// フィードバック優先度（LLMが推定）
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

// フィードバック入力データ
export interface FeedbackInput {
  category: FeedbackCategory;
  title: string;
  description: string;
  email?: string;                    // オプション：連絡先
  context?: FeedbackContext;
}

// フィードバックコンテキスト
export interface FeedbackContext {
  url: string;                       // フィードバック時のURL
  userAgent: string;                 // ブラウザ情報
  timestamp: string;                 // タイムスタンプ
  userId?: string;                   // ユーザーID（認証済みの場合）
  currentItinerary?: string;         // 現在のしおりデータ（JSON）
  viewport?: {
    width: number;
    height: number;
  };
}

// LLM処理後のフィードバック
export interface ProcessedFeedback {
  original: FeedbackInput;
  structured: StructuredFeedback;
}

// 構造化されたフィードバック
export interface StructuredFeedback {
  category: FeedbackCategory;
  priority: FeedbackPriority;
  labels: string[];                  // GitHub ラベル
  title: string;                     // 整形されたタイトル
  body: string;                      // 整形された本文
  estimatedEffort?: string;          // 推定工数
  suggestedSolution?: string;        // 提案される解決策
}

// GitHub Issue ペイロード
export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

// GitHub Issue レスポンス
export interface GitHubIssueResponse {
  number: number;
  url: string;
}

// API レスポンス
export interface FeedbackResponse {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  remaining?: number;                // 残りリクエスト数
  error?: string;
  details?: any;
}

// フィードバックUI状態
export type FeedbackUIState = 'idle' | 'submitting' | 'success' | 'error';

// カテゴリメタデータ
export interface CategoryMetadata {
  label: string;
  description: string;
  icon: string;                      // lucide-react アイコン名
  color: string;                     // Tailwind カラークラス
}

// カテゴリメタデータマップ
export const CATEGORY_METADATA: Record<FeedbackCategory, CategoryMetadata> = {
  bug: {
    label: 'バグ報告',
    description: '動作がおかしい、エラーが出る',
    icon: 'Bug',
    color: 'text-red-500'
  },
  feature: {
    label: '機能リクエスト',
    description: '新しい機能の提案',
    icon: 'Lightbulb',
    color: 'text-yellow-500'
  },
  'ui-ux': {
    label: 'UI/UX改善',
    description: '使いにくい、わかりにくい',
    icon: 'Palette',
    color: 'text-purple-500'
  },
  performance: {
    label: 'パフォーマンス',
    description: '遅い、重い',
    icon: 'Zap',
    color: 'text-orange-500'
  },
  content: {
    label: 'コンテンツ',
    description: 'AIの応答、テキストの改善',
    icon: 'FileText',
    color: 'text-blue-500'
  },
  other: {
    label: 'その他',
    description: '上記に当てはまらない',
    icon: 'MoreHorizontal',
    color: 'text-gray-500'
  }
};
