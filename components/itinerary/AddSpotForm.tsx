"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import { useSpotEditor } from "@/lib/hooks/itinerary";
import { TouristSpot } from "@/types/itinerary";
import { CATEGORY_OPTIONS } from '@/lib/utils/category-utils';
import { Plus, X } from "lucide-react";

interface AddSpotFormProps {
  dayIndex: number;
}

/**
 * Phase 6.1: スポット追加フォームコンポーネント
 * useSpotEditor Hookを活用してロジックを分離
 */
export const AddSpotForm: React.FC<AddSpotFormProps> = ({ dayIndex }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    category: "sightseeing" as TouristSpot["category"],
    scheduledTime: "",
    duration: "",
    estimatedCost: "",
    notes: "",
  });

  const currentItinerary = useStore((state) => state.currentItinerary);
  const addToast = useStore((state) => state.addToast);

  // useSpotEditor Hookを活用
  const { addSpot, validateSpot } = useSpotEditor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItinerary) {
      addToast("しおりが見つかりません", "error");
      return;
    }

    // バリデーション
    const spotData: Partial<TouristSpot> = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      category: formValues.category,
      scheduledTime: formValues.scheduledTime.trim() || undefined,
      duration: formValues.duration ? parseInt(formValues.duration) : undefined,
      estimatedCost: formValues.estimatedCost
        ? parseInt(formValues.estimatedCost)
        : undefined,
      notes: formValues.notes.trim() || undefined,
    };

    const validation = validateSpot(spotData);
    if (!validation.valid) {
      const errorMessage = validation.errors[0] || "入力内容にエラーがあります";
      addToast(errorMessage, "error");
      return;
    }

    // スポットを追加
    try {
      addSpot(dayIndex, spotData as Omit<TouristSpot, 'id'>);
      addToast("スポットを追加しました", "success");

      // Reset form
      setFormValues({
        name: "",
        description: "",
        category: "sightseeing",
        scheduledTime: "",
        duration: "",
        estimatedCost: "",
        notes: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add spot:", error);
      addToast("スポットの追加に失敗しました", "error");
    }
  };

  const handleCancel = () => {
    setFormValues({
      name: "",
      description: "",
      category: "sightseeing",
      scheduledTime: "",
      duration: "",
      estimatedCost: "",
      notes: "",
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">スポットを追加</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900">新しいスポットを追加</h4>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            スポット名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formValues.name}
            onChange={(e) =>
              setFormValues({ ...formValues, name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="例: 清水寺"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={formValues.description}
            onChange={(e) =>
              setFormValues({ ...formValues, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
            placeholder="スポットの概要を入力..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリー
          </label>
          <select
            value={formValues.category}
            onChange={(e) =>
              setFormValues({
                ...formValues,
                category: e.target.value as TouristSpot["category"],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="sightseeing">観光</option>
            <option value="restaurant">レストラン</option>
            <option value="hotel">宿泊</option>
            <option value="shopping">ショッピング</option>
            <option value="transport">移動</option>
            <option value="activity">アクティビティ</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予定時刻
            </label>
            <input
              type="time"
              value={formValues.scheduledTime}
              onChange={(e) =>
                setFormValues({ ...formValues, scheduledTime: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              滞在時間（分）
            </label>
            <input
              type="number"
              value={formValues.duration}
              onChange={(e) =>
                setFormValues({ ...formValues, duration: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="60"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            予算（円）
          </label>
          <input
            type="number"
            value={formValues.estimatedCost}
            onChange={(e) =>
              setFormValues({ ...formValues, estimatedCost: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="1000"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            value={formValues.notes}
            onChange={(e) =>
              setFormValues({ ...formValues, notes: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
            placeholder="個人的なメモを入力..."
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          追加
        </button>
      </div>
    </form>
  );
};
