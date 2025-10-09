/**
 * コメント機能の型定義（Phase 11）
 */

/**
 * コメントデータ
 */
export interface Comment {
  id: string;
  itineraryId: string;
  userId: string | null; // null = 匿名
  authorName: string; // 認証ユーザーはユーザー名、匿名は入力された名前
  content: string;
  isAnonymous: boolean;
  isReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * コメント投稿リクエスト
 */
export interface CreateCommentRequest {
  itineraryId: string;
  content: string;
  isAnonymous?: boolean;
  authorName?: string; // 匿名時に必須
}

/**
 * コメント更新リクエスト
 */
export interface UpdateCommentRequest {
  content?: string;
}

/**
 * コメント報告リクエスト
 */
export interface ReportCommentRequest {
  reason?: string; // 報告理由（オプション）
}

/**
 * コメント一覧取得のフィルター
 */
export interface CommentFilters {
  itineraryId: string;
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc'; // 'desc'=新着順、'asc'=古い順
}

/**
 * ページネーションオプション
 */
export interface CommentPaginationOptions {
  limit: number;
  offset: number;
}

/**
 * ページネーション付きコメント一覧レスポンス
 */
export interface PaginatedCommentsResponse {
  data: Comment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
