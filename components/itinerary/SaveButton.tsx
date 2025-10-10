"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, CheckCircle, ChevronDown, FilePlus } from "lucide-react";
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
  const router = useRouter();
  const { data: session } = useSession();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const addToast = useStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンを閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSave = async (mode: "overwrite" | "new" = "overwrite") => {
    if (!currentItinerary) return;

    setIsSaving(true);
    setIsDropdownOpen(false);

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
            addToast(mode === "new" ? "新規しおりとして保存しました" : "しおりを保存しました", "success");
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
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-0">
        {/* メイン保存ボタン（上書き保存） */}
        <button
          onClick={() => handleSave("overwrite")}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-l-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="しおりを上書き保存して一覧へ"
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

        {/* ドロップダウントグルボタン */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isSaving}
          className="px-2 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-blue-400"
          title="保存オプション"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* ドロップダウンメニュー */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <button
              onClick={() => handleSave("overwrite")}
              disabled={isSaving}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-start gap-3"
            >
              <Save size={20} className="mt-0.5 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">上書き保存</div>
                <div className="text-sm text-gray-500">現在のしおりを更新します</div>
              </div>
            </button>

            <div className="border-t border-gray-100" />

            <button
              onClick={() => handleSave("new")}
              disabled={isSaving}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-start gap-3"
            >
              <FilePlus size={20} className="mt-0.5 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">新規保存</div>
                <div className="text-sm text-gray-500">別のしおりとして保存します</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
