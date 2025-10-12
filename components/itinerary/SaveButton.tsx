"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Save, FilePlus } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { saveCurrentItinerary } from "@/lib/utils/storage";
import { updateItinerary, addItinerary } from "@/lib/mock-data/itineraries";
import { generateId } from "@/lib/utils/id-generator";
import { saveItineraryWithChatHistory } from "@/lib/utils/api-client";

/**
 * Phase 10.4: しおり保存ボタン（DB統合版）
 *
 * ログイン時: データベースに保存
 * 未ログイン時: LocalStorageに保存（従来通り）
 *
 * 保存モード:
 * - overwrite: 既存のしおりを上書き保存
 * - new: 新規のしおりとして保存（新しいIDを生成）
 */
export const SaveButton: React.FC = () => {
  const { data: session } = useSession();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const messages = useStore((state) => state.messages);
  const setItinerary = useStore((state) => state.setItinerary);
  const setItineraryUnsaved = useStore((state) => state.setItineraryUnsaved);
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

      if (session?.user) {
        // ログイン時: データベースに保存（チャット履歴も一緒に保存）
        const savedItinerary = await saveItineraryWithChatHistory(
          itineraryToSave,
          messages
        );

        // ストアを更新
        setItinerary(savedItinerary);
        setItineraryUnsaved(false);

        addToast(
          mode === "new"
            ? "新規しおりとチャット履歴を保存しました"
            : "しおりとチャット履歴を保存しました",
          "success"
        );
      } else {
        // 未ログイン時: LocalStorageに保存（従来通り）
        const success = saveCurrentItinerary(itineraryToSave);

        if (success) {
          // しおり一覧に追加/更新
          const itineraries = JSON.parse(
            localStorage.getItem("journee_itineraries") || "[]"
          );
          const existingIndex = itineraries.findIndex(
            (item: any) => item.id === itineraryToSave.id
          );

          if (existingIndex !== -1 && mode === "overwrite") {
            updateItinerary(itineraryToSave.id, itineraryToSave);
            addToast("しおりを更新しました", "success");
          } else {
            addItinerary(itineraryToSave);
            addToast(
              mode === "new"
                ? "新規しおりとして保存しました"
                : "しおりを保存しました",
              "success"
            );
          }
        } else {
          throw new Error("Failed to save to LocalStorage");
        }
      }
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
