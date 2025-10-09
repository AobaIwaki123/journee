/**
 * CommentForm（Phase 11）
 * コメント投稿フォームコンポーネント
 */

"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface CommentFormProps {
  itineraryId: string;
  isAuthenticated: boolean;
  onSubmit: (data: {
    content: string;
    isAnonymous: boolean;
    authorName?: string;
  }) => Promise<void>;
}

export default function CommentForm({
  itineraryId,
  isAuthenticated,
  onSubmit,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(!isAuthenticated);
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (content.trim().length === 0) {
      setError("コメントを入力してください");
      return;
    }

    if (content.length > maxLength) {
      setError(`コメントは${maxLength}文字以内で入力してください`);
      return;
    }

    if (isAnonymous && authorName.trim().length === 0) {
      setError("名前を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        content: content.trim(),
        isAnonymous,
        authorName: isAnonymous ? authorName.trim() : undefined,
      });

      // フォームをリセット
      setContent("");
      setAuthorName("");
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "コメントの投稿に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 匿名投稿の場合の名前入力 */}
      {isAnonymous && (
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-medium text-gray-700"
          >
            名前
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="匿名ユーザー"
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* コメント入力 */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          コメント
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="コメントを入力..."
          rows={3}
          maxLength={maxLength}
          className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        <div className="mt-1 flex items-center justify-between">
          <p
            className={`text-xs ${
              remainingChars < 50 ? "text-orange-600" : "text-gray-500"
            }`}
          >
            残り{remainingChars}文字
          </p>
        </div>
      </div>

      {/* 匿名投稿チェックボックス */}
      {isAuthenticated && (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <span className="text-sm text-gray-700">匿名で投稿</span>
        </label>
      )}

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 投稿ボタン */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{isSubmitting ? "投稿中..." : "投稿"}</span>
        </button>
      </div>
    </form>
  );
}
