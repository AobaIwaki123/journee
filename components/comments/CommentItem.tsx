/**
 * CommentItem（Phase 11）
 * 個別コメント表示コンポーネント
 */

"use client";

import { useState } from "react";
import { Trash2, Flag, User } from "lucide-react";
import type { Comment } from "@/types/comment";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string | null;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReport,
}: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const isOwner = currentUserId && comment.userId === currentUserId;

  const handleDelete = async () => {
    if (!confirm("このコメントを削除しますか？")) return;

    setIsDeleting(true);
    try {
      await onDelete?.(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    if (!confirm("このコメントを不適切として報告しますか？")) return;

    setIsReporting(true);
    try {
      await onReport?.(comment.id);
      alert("コメントを報告しました。管理者が確認します。");
    } finally {
      setIsReporting(false);
    }
  };

  // 相対時間の計算
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "たった今";
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-start justify-between">
        {/* ユーザー情報 */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {comment.authorName}
              {comment.isAnonymous && (
                <span className="ml-2 text-xs text-gray-500">(匿名)</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {getRelativeTime(comment.createdAt)}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center space-x-2">
          {isOwner && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!isOwner && onReport && (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="報告"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* コメント内容 */}
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
        {comment.content}
      </p>
    </div>
  );
}
