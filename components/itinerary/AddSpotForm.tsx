'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { TouristSpot } from '@/types/itinerary';
import { Plus, X } from 'lucide-react';

interface AddSpotFormProps {
  dayIndex: number;
}

export const AddSpotForm: React.FC<AddSpotFormProps> = ({ dayIndex }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    category: 'sightseeing' as TouristSpot['category'],
    scheduledTime: '',
    duration: '',
    estimatedCost: '',
    notes: '',
  });

  const addSpot = useStore((state) => state.addSpot);
  const addToast = useStore((state) => state.addToast);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.name.trim()) {
      addToast('スポット名を入力してください', 'error');
      return;
    }

    const newSpot: TouristSpot = {
      id: `spot-${Date.now()}`,
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      category: formValues.category,
      scheduledTime: formValues.scheduledTime.trim() || undefined,
      duration: formValues.duration ? parseInt(formValues.duration) : undefined,
      estimatedCost: formValues.estimatedCost ? parseInt(formValues.estimatedCost) : undefined,
      notes: formValues.notes.trim() || undefined,
    };

    addSpot(dayIndex, newSpot);
    addToast('スポットを追加しました', 'success');

    // Reset form
    setFormValues({
      name: '',
      description: '',
      category: 'sightseeing',
      scheduledTime: '',
      duration: '',
      estimatedCost: '',
      notes: '',
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setFormValues({
      name: '',
      description: '',
      category: 'sightseeing',
      scheduledTime: '',
      duration: '',
      estimatedCost: '',
      notes: '',
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
    <form onSubmit={handleSubmit} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
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
            onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="例: 清水寺"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            value={formValues.category}
            onChange={(e) => setFormValues({ ...formValues, category: e.target.value as TouristSpot['category'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="sightseeing">観光</option>
            <option value="dining">食事</option>
            <option value="transportation">移動</option>
            <option value="accommodation">宿泊</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={formValues.description}
            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
            placeholder="スポットの説明を入力"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予定時刻
            </label>
            <input
              type="time"
              value={formValues.scheduledTime}
              onChange={(e) => setFormValues({ ...formValues, scheduledTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所要時間（分）
            </label>
            <input
              type="number"
              value={formValues.duration}
              onChange={(e) => setFormValues({ ...formValues, duration: e.target.value })}
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
            onChange={(e) => setFormValues({ ...formValues, estimatedCost: e.target.value })}
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
            onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
            placeholder="注意事項やメモを入力"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          追加
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
};