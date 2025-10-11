/**
 * Phase 9.2: スポット追加フォーム（再構成版）
 * 
 * フォームフィールドを SpotFormFields に分離し、
 * 共通コンポーネントを活用して簡素化
 */

"use client";

import React, { useState } from "react";
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from "@/lib/store/itinerary";
import { useSpotEditor } from "@/lib/hooks/itinerary";
import { TouristSpot } from "@/types/itinerary";
import { SpotFormFields } from "./spot-form";
import { FormActions } from "@/components/ui";
import { Plus, X } from "lucide-react";

interface AddSpotFormProps {
  dayIndex: number;
}

const initialFormValues = {
  name: "",
  description: "",
  category: "sightseeing" as TouristSpot["category"],
  scheduledTime: "",
  duration: "",
  estimatedCost: "",
  notes: "",
};

export const AddSpotForm: React.FC<AddSpotFormProps> = ({ dayIndex }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormValues);

  // Phase 10.3: useUIStoreとuseItineraryStore使用
  const { currentItinerary } = useItineraryStore();
  const { addToast } = useUIStore();
  const { addSpot, validateSpot } = useSpotEditor();

  const handleFieldChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

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
      addSpot(dayIndex, spotData as Omit<TouristSpot, "id">);
      addToast("スポットを追加しました", "success");
      setFormValues(initialFormValues);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add spot:", error);
      addToast("スポットの追加に失敗しました", "error");
    }
  };

  const handleCancel = () => {
    setFormValues(initialFormValues);
    setIsOpen(false);
  };

  // トリガーボタン
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

  // フォーム表示
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

      <SpotFormFields
        values={formValues}
        onChange={handleFieldChange}
      />

      <FormActions
        onCancel={handleCancel}
        submitLabel="追加"
      />
    </form>
  );
};
