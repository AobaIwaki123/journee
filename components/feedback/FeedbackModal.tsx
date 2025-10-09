/**
 * フィードバックモーダルコンポーネント
 * ユーザーからのフィードバックを収集し、GitHub Issueとして送信
 */

"use client";

import React, { useState } from "react";
import {
  X,
  Bug,
  Lightbulb,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import type {
  FeedbackCategory,
  FeedbackSubmission,
  FeedbackResponse,
} from "@/types/feedback";
import { FEEDBACK_CATEGORY_LABELS } from "@/types/feedback";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: session } = useSession();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  // モーダルが閉じられている場合は何も表示しない
  if (!isOpen) return null;

  // フォームをリセット
  const resetForm = () => {
    setCategory("bug");
    setTitle("");
    setDescription("");
    setStatus("idle");
    setErrorMessage("");
    setIssueUrl("");
  };

  // モーダルを閉じる
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // フィードバックを送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setErrorMessage("タイトルと詳細を入力してください。");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const submission: FeedbackSubmission = {
        category,
        title: title.trim(),
        description: description.trim(),
        userEmail: session?.user?.email || undefined,
        userName: session?.user?.name || undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      });

      const data: FeedbackResponse = await response.json();

      if (data.success && data.issueUrl) {
        setStatus("success");
        setIssueUrl(data.issueUrl);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "フィードバックの送信に失敗しました。");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setStatus("error");
      setErrorMessage("ネットワークエラーが発生しました。");
    }
  };

  // カテゴリーアイコン
  const getCategoryIcon = (cat: FeedbackCategory) => {
    switch (cat) {
      case "bug":
        return <Bug className="w-5 h-5" />;
      case "enhancement":
        return <Lightbulb className="w-5 h-5" />;
      case "question":
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {status === "success"
              ? "フィードバックを送信しました"
              : "フィードバック"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {status === "success" ? (
            // 送信成功
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                送信完了
              </h3>
              <p className="text-gray-600 mb-6">
                フィードバックをありがとうございます！
                <br />
                GitHub Issueとして登録されました。
              </p>
              {issueUrl && (
                <a
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Issueを確認
                </a>
              )}
              <button
                onClick={handleClose}
                className="block w-full mt-4 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          ) : (
            // フォーム
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* カテゴリー選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  カテゴリー
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    ["bug", "enhancement", "question"] as FeedbackCategory[]
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                        category === cat
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span className="text-sm font-medium mt-2">
                        {FEEDBACK_CATEGORY_LABELS[cat]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* タイトル */}
              <div>
                <label
                  htmlFor="feedback-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: ログインボタンが動作しない"
                  maxLength={100}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/100文字
                </p>
              </div>

              {/* 詳細 */}
              <div>
                <label
                  htmlFor="feedback-description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  詳細 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="詳細な説明をご記入ください..."
                  rows={6}
                  maxLength={2000}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/2000文字
                </p>
              </div>

              {/* ユーザー情報表示 */}
              {session && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    送信者:{" "}
                    <span className="font-medium">
                      {session.user?.name || session.user?.email}
                    </span>
                  </p>
                </div>
              )}

              {/* エラーメッセージ */}
              {status === "error" && errorMessage && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* ボタン */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={status === "submitting"}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={
                    status === "submitting" ||
                    !title.trim() ||
                    !description.trim()
                  }
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>送信中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>送信</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
