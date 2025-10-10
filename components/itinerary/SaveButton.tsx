"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Save, FilePlus } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { saveCurrentItinerary } from "@/lib/utils/storage";
import { updateItinerary, addItinerary } from "@/lib/mock-data/itineraries";
import { generateId } from "@/lib/utils/id-generator";

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

      if (session?.user) {
        // ログイン時: データベースに保存
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

  // 保存先を示すツールチップテキスト
  const getSaveTooltip = (mode: "overwrite" | "new") => {
    if (session?.user) {
      return mode === "overwrite"
        ? "現在のしおりをデータベースに上書き保存します"
        : "新しいしおりとしてデータベースに保存します";
    }
    return mode === "overwrite"
      ? "現在のしおりをブラウザに上書き保存します（ログインするとデータベースに保存されます）"
      : "新しいしおりとしてブラウザに保存します（ログインするとデータベースに保存されます）";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* 上書き保存ボタン */}
        <button
          onClick={() => handleSave("overwrite")}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={getSaveTooltip("overwrite")}
        >
          <Save size={20} />
          <span>{isSaving ? "保存中..." : "上書き保存"}</span>
        </button>

        {/* 新規保存ボタン */}
        <button
          onClick={() => handleSave("new")}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={getSaveTooltip("new")}
        >
          <FilePlus size={20} />
          <span>{isSaving ? "保存中..." : "新規保存"}</span>
        </button>
      </div>

      {/* 未ログインユーザー向けの説明テキスト */}
      {!session?.user && (
        <p className="text-xs text-gray-500">
          ※現在はブラウザにのみ保存されます。<a href="/login" className="text-blue-600 hover:underline">ログイン</a>するとデータベースに永続的に保存されます。
        </p>
      )}
    </div>
  );
};
