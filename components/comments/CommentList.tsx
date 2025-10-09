/**
 * CommentList（Phase 11）
 * コメント一覧表示コンポーネント
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import type { Comment, PaginatedCommentsResponse } from "@/types/comment";

interface CommentListProps {
  itineraryId: string;
  initialComments?: Comment[];
  initialTotal?: number;
  currentUserId?: string | null;
}

export default function CommentList({
  itineraryId,
  initialComments = [],
  initialTotal = 0,
  currentUserId,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(initialComments.length);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialComments.length < initialTotal
  );

  const limit = 10;

  // コメントの読み込み
  const loadComments = useCallback(
    async (offsetValue: number) => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/itinerary/${itineraryId}/comments?limit=${limit}&offset=${offsetValue}&sortOrder=desc`
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to fetch comments:", errorData);
          throw new Error(errorData.error || "Failed to fetch comments");
        }

        const data: PaginatedCommentsResponse = await response.json();

        setComments((prev) => [...prev, ...data.data]);
        setTotal(data.pagination.total);
        setOffset(offsetValue + data.data.length);
        setHasMore(data.pagination.hasMore);
      } catch (error) {
        console.error("Failed to load comments:", error);
        alert("コメントの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    },
    [itineraryId]
  );

  // さらに読み込む
  const handleLoadMore = () => {
    loadComments(offset);
  };

  // コメント投稿
  const handleSubmit = async (data: {
    content: string;
    isAnonymous: boolean;
    authorName?: string;
  }) => {
    console.log("Submitting comment for itinerary:", itineraryId);
    const response = await fetch(`/api/itinerary/${itineraryId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to submit comment:", error);
      throw new Error(error.error || "コメントの投稿に失敗しました");
    }

    const newComment: Comment = await response.json();

    // コメントを先頭に追加
    setComments((prev) => [newComment, ...prev]);
    setTotal((prev) => prev + 1);
  };

  // コメント削除
  const handleDelete = async (commentId: string) => {
    const response = await fetch(
      `/api/itinerary/${itineraryId}/comments/${commentId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "コメントの削除に失敗しました");
    }

    // コメントをリストから削除
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((prev) => prev - 1);
  };

  // コメント報告
  const handleReport = async (commentId: string) => {
    const response = await fetch(
      `/api/itinerary/${itineraryId}/comments/${commentId}/report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "コメントの報告に失敗しました");
    }

    // コメントをリストから削除（報告されたコメントは非表示）
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((prev) => prev - 1);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          コメント ({total}件)
        </h2>
      </div>

      {/* コメント投稿フォーム */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <CommentForm
          itineraryId={itineraryId}
          isAuthenticated={!!currentUserId}
          onSubmit={handleSubmit}
        />
      </div>

      {/* コメント一覧 */}
      {comments.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-200 p-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onReport={handleReport}
              />
            ))}
          </div>

          {/* さらに読み込むボタン */}
          {hasMore && (
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronDown className="h-4 w-4" />
                <span>{isLoading ? "読み込み中..." : "さらに読み込む"}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            まだコメントがありません。最初のコメントを投稿しましょう！
          </p>
        </div>
      )}
    </div>
  );
}
