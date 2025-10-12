"use client";

import React, { useState } from "react";
import { Brain, Key, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { APIKeyModal } from "./APIKeyModal";
import { AI_MODELS } from "@/lib/ai/models";
import { maskApiKey } from "@/lib/utils/api-key-utils";
import type { AIModelId } from "@/types/ai";

/**
 * AI設定コンポーネント
 * AIモデル選択とAPIキー管理
 */
export const AISettings: React.FC = () => {
  const selectedAI = useStore((state: any) => state.selectedAI);
  const claudeApiKey = useStore((state: any) => state.claudeApiKey);
  const setSelectedAI = useStore((state: any) => state.setSelectedAI);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAIChange = (ai: AIModelId) => {
    // Claudeを選択する際にAPIキーがない場合はモーダルを開く
    if (ai === "claude" && !claudeApiKey) {
      setIsModalOpen(true);
      return;
    }
    setSelectedAI(ai);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">AI設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          使用するAIモデルと関連設定を管理します
        </p>
      </div>

      {/* AIモデル選択 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">デフォルトAIモデル</h3>
            <p className="text-sm text-gray-600 mt-1">
              チャットで使用するAIモデルを選択してください
            </p>
            <div className="mt-4 space-y-3">
              {/* Gemini */}
              <label
                className="flex items-start space-x-3 cursor-pointer p-4 border-2 rounded-lg transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedAI === "gemini" ? "#3b82f6" : "#e5e7eb",
                  backgroundColor:
                    selectedAI === "gemini" ? "#eff6ff" : "white",
                }}
              >
                <input
                  type="radio"
                  name="aiModel"
                  value="gemini"
                  checked={selectedAI === "gemini"}
                  onChange={() => handleAIChange("gemini")}
                  className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {AI_MODELS.gemini.displayName}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      無料
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {AI_MODELS.gemini.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-700">
                      APIキー設定不要
                    </span>
                  </div>
                </div>
              </label>

              {/* Claude */}
              <label
                className="flex items-start space-x-3 cursor-pointer p-4 border-2 rounded-lg transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedAI === "claude" ? "#3b82f6" : "#e5e7eb",
                  backgroundColor:
                    selectedAI === "claude" ? "#eff6ff" : "white",
                }}
              >
                <input
                  type="radio"
                  name="aiModel"
                  value="claude"
                  checked={selectedAI === "claude"}
                  onChange={() => handleAIChange("claude")}
                  className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500"
                  disabled={!claudeApiKey}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {AI_MODELS.claude.displayName}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                      有料
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {AI_MODELS.claude.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {claudeApiKey ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-700">
                          APIキー設定済み: {maskApiKey(claudeApiKey)}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-orange-700">
                          APIキーが必要です
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Claude APIキー管理 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">Claude APIキー</h3>
            <p className="text-sm text-gray-600 mt-1">
              Claude APIを使用するにはAPIキーの登録が必要です
            </p>
            <div className="mt-4 flex items-center space-x-3">
              {claudeApiKey ? (
                <>
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        登録済み: {maskApiKey(claudeApiKey)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    変更
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  APIキーを登録
                </button>
              )}
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 APIキーは
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Anthropic Console
                </a>
                から取得できます
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* セキュリティに関する注意 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">
              セキュリティに関する注意
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              APIキーはサーバーサイドで暗号化して保存されます。
              共有PCを使用している場合は、使用後に必ずAPIキーを削除してください。
            </p>
          </div>
        </div>
      </div>

      {/* APIキー設定モーダル */}
      <APIKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
