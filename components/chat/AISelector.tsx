"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import { APIKeyModal } from "@/components/settings/APIKeyModal";

export const AISelector: React.FC = () => {
  const selectedAI = useStore((state) => state.selectedAI);
  const claudeApiKey = useStore((state) => state.claudeApiKey);
  const setSelectedAI = useStore((state) => state.setSelectedAI);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAIChange = (ai: "gemini" | "claude") => {
    // Claudeを選択しようとした場合、APIキーの確認
    if (ai === "claude" && !claudeApiKey) {
      // APIキーが未設定の場合、モーダルを表示
      setIsModalOpen(true);
      return;
    }

    setSelectedAI(ai);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">AIモデル:</span>
        <select
          value={selectedAI}
          onChange={(e) =>
            handleAIChange(e.target.value as "gemini" | "claude")
          }
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gemini">Gemini 2.5 Pro</option>
          <option value="claude">
            Claude 4.5 Sonnet {!claudeApiKey && "(APIキー必要)"}
          </option>
        </select>
      </div>

      {/* APIキー設定モーダル */}
      <APIKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
