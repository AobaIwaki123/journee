"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { saveCurrentItinerary } from "@/lib/utils/storage";
import { updateItinerary, addItinerary } from "@/lib/mock-data/itineraries";

/**
 * Phase 10.4: しおり保存ボタン（DB統合版）
 *
 * ログイン時: データベースに保存
 * 未ログイン時: LocalStorageに保存（従来通り）
 */
export const SaveButton: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const addToast = useStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentItinerary) return;

    setIsSaving(true);

    try {
      if (session?.user) {
        // ログイン時: データベースに保存
        // Phase 10.4: クライアント側のUUIDをそのまま使用するため、ID更新処理は不要
        const response = await fetch("/api/itinerary/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itinerary: currentItinerary }),
        });

        if (!response.ok) {
          throw new Error("Failed to save itinerary to database");
        }

        const data = await response.json();
        addToast(data.message || "しおりを保存しました", "success");
        // currentItinerary.id はそのまま有効（DB側でも同じIDが使用される）
      } else {
        // 未ログイン時: LocalStorageに保存（従来通り）
        const success = saveCurrentItinerary(currentItinerary);

        if (success) {
          // しおり一覧に追加/更新
          const itineraries = JSON.parse(
            localStorage.getItem("journee_itineraries") || "[]"
          );
          const existingIndex = itineraries.findIndex(
            (item: any) => item.id === currentItinerary.id
          );

          if (existingIndex !== -1) {
            updateItinerary(currentItinerary.id, currentItinerary);
            addToast("しおりを更新しました", "success");
          } else {
            addItinerary(currentItinerary);
            addToast("しおりを保存しました", "success");
          }
        } else {
          throw new Error("Failed to save to LocalStorage");
        }
      }

      // しおり一覧ページへ遷移
      setTimeout(() => {
        router.push("/itineraries");
      }, 500);
    } catch (error) {
      console.error("Failed to save itinerary:", error);
      addToast("保存に失敗しました", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentItinerary) return null;

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="しおりを保存して一覧へ"
    >
      {isSaving ? (
        <>
          <Save size={20} className="animate-pulse" />
          <span>保存中...</span>
        </>
      ) : (
        <>
          <CheckCircle size={20} />
          <span>保存して一覧へ</span>
        </>
      )}
    </button>
  );
};
