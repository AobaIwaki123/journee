"use client";

import React from "react";
import { Save, FilePlus } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { useItineraryStore } from "@/lib/store/itinerary";
import { useItinerarySave } from "@/lib/hooks/itinerary";
import { generateId } from "@/lib/utils/id-generator";

/**
 * しおり保存ボタン（リファクタリング版）
 *
 * useItinerarySaveカスタムHookを使用してロジックを分離
 *
 * ログイン時: データベースに保存
 * 未ログイン時: LocalStorageに保存
 *
 * 保存モード:
 * - overwrite: 既存のしおりを上書き保存
 * - new: 新規のしおりとして保存（新しいIDを生成）
 */
export const SaveButton: React.FC = () => {
  // Phase 9 Bug Fix: useItineraryStoreからcurrentItineraryとsetItineraryを取得
  const { currentItinerary, setItinerary } = useItineraryStore();
  
  // カスタムHookを使用
  const { save, isSaving } = useItinerarySave({
    storage: 'auto', // ログイン状態に応じて自動選択
  });

  const handleSave = async (mode: "overwrite" | "new" = "overwrite") => {
    if (!currentItinerary) return;

    // 新規保存の場合は新しいIDを生成してストアを更新
    if (mode === "new") {
      const newId = generateId();
      const newItinerary = {
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

      setItinerary(newItinerary);
      
      // 新しいIDで保存（次のレンダリングで反映されるため、少し待つ）
      setTimeout(async () => {
        await save(mode);
      }, 100);
    } else {
      // 上書き保存の場合はそのまま保存
      await save(mode);
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
