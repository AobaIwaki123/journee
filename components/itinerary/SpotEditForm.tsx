/**
 * Phase 7.2: SpotEditForm - スポット編集フォーム
 * 
 * SpotCardから編集UIを分離した専用コンポーネント
 */

'use client';

import React from 'react';
import { TouristSpot } from '@/types/itinerary';
import { Check, X } from 'lucide-react';

interface SpotEditFormProps {
  spot: TouristSpot;
  editValues: {
    name: string;
    description: string;
    scheduledTime: string;
    duration: string;
    estimatedCost: string;
    notes: string;
  };
  onEditValuesChange: (values: SpotEditFormProps['editValues']) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SpotEditForm: React.FC<SpotEditFormProps> = ({
  spot,
  editValues,
  onEditValuesChange,
  onSave,
  onCancel,
}) => {
  const handleChange = (field: keyof typeof editValues, value: string) => {
    onEditValuesChange({
      ...editValues,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-blue-400 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900">スポット編集</h4>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="保存"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            title="キャンセル"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            スポット名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editValues.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 清水寺"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={editValues.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
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
              value={editValues.scheduledTime}
              onChange={(e) => handleChange('scheduledTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所要時間（分）
            </label>
            <input
              type="number"
              value={editValues.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            value={editValues.estimatedCost}
            onChange={(e) => handleChange('estimatedCost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            value={editValues.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="注意事項やメモを入力"
          />
        </div>
      </div>
    </div>
  );
};
