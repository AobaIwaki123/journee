/**
 * フィードバック関連の型定義
 */

/**
 * フィードバックのカテゴリ
 */
export type FeedbackCategory = 'bug' | 'enhancement' | 'question';

/**
 * フィードバックの送信データ
 */
export interface FeedbackSubmission {
  category: FeedbackCategory;
  title: string;
  description: string;
  userEmail?: string;
  userName?: string;
  userAgent?: string;
  url?: string;
  screenshot?: string; // Base64 encoded image (オプション)
}

/**
 * フィードバックAPIのレスポンス
 */
export interface FeedbackResponse {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  error?: string;
}

/**
 * GitHub Issue作成リクエスト
 */
export interface GitHubIssueRequest {
  title: string;
  body: string;
  labels: string[];
}

/**
 * GitHub Issue作成レスポンス
 */
export interface GitHubIssueResponse {
  html_url: string;
  number: number;
}

/**
 * フィードバックカテゴリのラベルマッピング
 */
export const FEEDBACK_LABELS: Record<FeedbackCategory, string> = {
  bug: 'bug',
  enhancement: 'enhancement',
  question: 'question',
};

/**
 * フィードバックカテゴリの表示名
 */
export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'バグ報告',
  enhancement: '機能要望',
  question: 'その他',
};
