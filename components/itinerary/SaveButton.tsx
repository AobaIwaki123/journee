"use client";

import React, { useState } from "react";
import { Save, FilePlus } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { generateId } from "@/lib/utils/id-generator";

/**
 * しおり保存ボタン（認証必須版）
 *
 * middlewareで認証保護されているため、常にデータベースに保存。
 *
 * 保存モード:
 * - overwrite: 既存のしおりを上書き保存
 * - new: 新規のしおりとして保存（新しいIDを生成）
 */
export const SaveButton: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const addToast = useStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (mode: "overwrite" | "new" = "overwrite") => {
    if (!currentItinerary) return;

    setIsSaving(true);

    try {
      let itineraryToSave = currentItinerary;

      // 新規保存の場合は新しいIDを生成
      if (mode === "new") {
        const newId = generateId();
        itineraryToSave = {
          ...currentItinerary,
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
          // 公開情報をクリア（新規保存時は非公開に）
          isPublic: false,
          publicSlug: undefined,
          publishedAt: undefined,
          viewCount: undefined,
        };

        // ZustandストアのcurrentItineraryを更新
        setItinerary(itineraryToSave);
      }

      // データベースに保存
      const response = await fetch("/api/itinerary/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary: itineraryToSave,
          saveMode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save itinerary to database");
      }

      const data = await response.json();
      addToast(data.message || "しおりを保存しました", "success");
    } catch (error) {
      console.error("Failed to save itinerary:", error);
      addToast("保存に失敗しました", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentItinerary) return null;

  return (
    <div className="flex items-center gap-2">
      {/* 上書き保存ボタン */}
      <button
        onClick={() => handleSave("overwrite")}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="現在のしおりを上書き保存"
      >
        <Save size={20} />
        <span>{isSaving ? "保存中..." : "上書き保存"}</span>
      </button>

      {/* 新規保存ボタン */}
      <button
        onClick={() => handleSave("new")}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="別のしおりとして保存"
      >
        <FilePlus size={20} />
        <span>{isSaving ? "保存中..." : "新規保存"}</span>
      </button>
    </div>
  );
};
