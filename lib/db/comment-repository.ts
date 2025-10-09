/**
 * Comment Repository (Phase 11)
 *
 * コメントデータのCRUD操作を提供するリポジトリクラス
 */

import { supabase, supabaseAdmin } from "./supabase";
import type {
  Comment,
  CommentFilters,
  CommentPaginationOptions,
  PaginatedCommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@/types/comment";
import type { Database } from "@/types/database";

type DbComment = Database["public"]["Tables"]["comments"]["Row"];

/**
 * コメントリポジトリ
 */
export class CommentRepository {
  /**
   * データベース形式からアプリケーション形式へ変換
   */
  private dbToComment(dbComment: DbComment): Comment {
    return {
      id: dbComment.id,
      itineraryId: dbComment.itinerary_id,
      userId: dbComment.user_id,
      authorName: dbComment.author_name || "匿名ユーザー",
      content: dbComment.content,
      isAnonymous: dbComment.is_anonymous || false,
      isReported: dbComment.is_reported || false,
      createdAt: new Date(dbComment.created_at),
      updatedAt: new Date(dbComment.updated_at),
    };
  }

  /**
   * コメントの作成
   */
  async createComment(
    request: CreateCommentRequest,
    userId?: string | null
  ): Promise<Comment> {
    // 匿名の場合はauthorNameが必須
    if (request.isAnonymous && !request.authorName) {
      throw new Error("匿名投稿の場合は名前が必要です");
    }

    // コンテンツのバリデーション（最大500文字）
    if (request.content.length > 500) {
      throw new Error("コメントは500文字以内で入力してください");
    }

    if (request.content.trim().length === 0) {
      throw new Error("コメントを入力してください");
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        itinerary_id: request.itineraryId,
        user_id: request.isAnonymous ? null : userId || null,
        author_name: request.authorName || null,
        content: request.content.trim(),
        is_anonymous: request.isAnonymous || false,
        is_reported: false,
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`コメントの投稿に失敗しました: ${error.message}`);
    }

    return this.dbToComment(data);
  }

  /**
   * コメント一覧の取得（ページネーション対応）
   */
  async listComments(
    filters: CommentFilters,
    pagination: CommentPaginationOptions
  ): Promise<PaginatedCommentsResponse> {
    const sortBy = filters.sortBy || "created_at";
    const sortOrder = filters.sortOrder || "desc";

    // コメント総数を取得
    const { count, error: countError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("itinerary_id", filters.itineraryId)
      .eq("is_reported", false); // 報告されたコメントは非表示

    if (countError) {
      throw new Error(`コメント数の取得に失敗しました: ${countError.message}`);
    }

    // コメント一覧を取得
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("itinerary_id", filters.itineraryId)
      .eq("is_reported", false)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      throw new Error(`コメントの取得に失敗しました: ${error.message}`);
    }

    const comments = (data || []).map((item: DbComment) =>
      this.dbToComment(item)
    );

    return {
      data: comments,
      pagination: {
        total: count || 0,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore:
          pagination.offset + pagination.limit < (count || 0),
      },
    };
  }

  /**
   * コメントの取得（ID指定）
   */
  async getComment(commentId: string): Promise<Comment | null> {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.dbToComment(data);
  }

  /**
   * コメントの更新
   */
  async updateComment(
    commentId: string,
    userId: string,
    updates: UpdateCommentRequest
  ): Promise<Comment> {
    // コンテンツのバリデーション
    if (updates.content) {
      if (updates.content.length > 500) {
        throw new Error("コメントは500文字以内で入力してください");
      }

      if (updates.content.trim().length === 0) {
        throw new Error("コメントを入力してください");
      }
    }

    const { data, error } = await supabase
      .from("comments")
      .update({
        content: updates.content?.trim(),
      } as any)
      .eq("id", commentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`コメントの更新に失敗しました: ${error.message}`);
    }

    return this.dbToComment(data);
  }

  /**
   * コメントの削除
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`コメントの削除に失敗しました: ${error.message}`);
    }

    return true;
  }

  /**
   * コメントの報告
   */
  async reportComment(commentId: string): Promise<boolean> {
    // Admin権限を使用（RLSをバイパス）
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { error } = await (client as any)
      .from("comments")
      .update({ is_reported: true })
      .eq("id", commentId);

    if (error) {
      throw new Error(`コメントの報告に失敗しました: ${error.message}`);
    }

    return true;
  }

  /**
   * しおりのコメント数を取得
   */
  async getCommentCount(itineraryId: string): Promise<number> {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("itinerary_id", itineraryId)
      .eq("is_reported", false);

    if (error) {
      console.error("Failed to get comment count:", error);
      return 0;
    }

    return count || 0;
  }
}

// シングルトンインスタンス
export const commentRepository = new CommentRepository();
