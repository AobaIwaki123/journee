/**
 * Phase 9.2: SpotFormFields - スポットフォームフィールド群
 * 
 * AddSpotFormとSpotEditFormで共通利用
 */

'use client';

import React from 'react';
import { TouristSpot } from '@/types/itinerary';
import { CATEGORY_OPTIONS } from '@/lib/utils/category-utils';
import { FormField } from '@/components/ui';

interface SpotFormFieldsProps {
  values: {
    name: string;
    description: string;
    category: TouristSpot['category'];
    scheduledTime: string;
    duration: string;
    estimatedCost: string;
    notes: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export const SpotFormFields: React.FC<SpotFormFieldsProps> = ({
  values,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-3">
      {/* スポット名 */}
      <FormField label="スポット名" required error={errors.name}>
        <input
          type="text"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="例: 清水寺"
          required
        />
      </FormField>

      {/* 説明 */}
      <FormField label="説明" error={errors.description}>
        <textarea
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          rows={2}
          placeholder="スポットの概要を入力..."
        />
      </FormField>

      {/* カテゴリー */}
      <FormField label="カテゴリー" error={errors.category}>
        <select
          value={values.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* 予定時刻・滞在時間 */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="予定時刻" error={errors.scheduledTime}>
          <input
            type="time"
            value={values.scheduledTime}
            onChange={(e) => onChange('scheduledTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </FormField>

        <FormField label="滞在時間（分）" error={errors.duration}>
          <input
            type="number"
            value={values.duration}
            onChange={(e) => onChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="60"
            min="0"
          />
        </FormField>
      </div>

      {/* 予算 */}
      <FormField label="予算（円）" error={errors.estimatedCost}>
        <input
          type="number"
          value={values.estimatedCost}
          onChange={(e) => onChange('estimatedCost', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="1000"
          min="0"
        />
      </FormField>

      {/* メモ */}
      <FormField label="メモ" error={errors.notes}>
        <textarea
          value={values.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          rows={2}
          placeholder="個人的なメモを入力..."
        />
      </FormField>
    </div>
  );
};
