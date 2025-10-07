'use client';

import React, { useState, useEffect } from 'react';
import { TouristSpot } from '@/types/itinerary';
import { X, Save, MapPin, Clock, DollarSign, FileText } from 'lucide-react';

interface EditSpotModalProps {
  spot: TouristSpot;
  isOpen: boolean;
  onClose: () => void;
  onSave: (spot: TouristSpot) => void;
}

export const EditSpotModal: React.FC<EditSpotModalProps> = ({
  spot,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedSpot, setEditedSpot] = useState<TouristSpot>(spot);

  useEffect(() => {
    setEditedSpot(spot);
  }, [spot]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedSpot);
    onClose();
  };

  const handleChange = (field: keyof TouristSpot, value: any) => {
    setEditedSpot(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: 'address' | 'lat' | 'lng', value: string) => {
    setEditedSpot(prev => ({
      ...prev,
      location: {
        ...prev.location,
        lat: prev.location?.lat || 0,
        lng: prev.location?.lng || 0,
        [field]: field === 'address' ? value : parseFloat(value) || 0,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold">スポットを編集</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スポット名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedSpot.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 清水寺"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              value={editedSpot.category || 'other'}
              onChange={(e) => handleChange('category', e.target.value as TouristSpot['category'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sightseeing">🏛️ 観光</option>
              <option value="dining">🍽️ 食事</option>
              <option value="transportation">🚗 移動</option>
              <option value="accommodation">🏨 宿泊</option>
              <option value="other">📍 その他</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              説明
            </label>
            <textarea
              value={editedSpot.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="このスポットの説明を入力してください"
            />
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                予定時刻
              </label>
              <input
                type="time"
                value={editedSpot.scheduledTime || ''}
                onChange={(e) => handleChange('scheduledTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                滞在時間（分）
              </label>
              <input
                type="number"
                value={editedSpot.duration || ''}
                onChange={(e) => handleChange('duration', parseInt(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="60"
                min="0"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              住所
            </label>
            <input
              type="text"
              value={editedSpot.location?.address || ''}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 京都府京都市東山区清水1-294"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                緯度
              </label>
              <input
                type="number"
                step="0.000001"
                value={editedSpot.location?.lat || ''}
                onChange={(e) => handleLocationChange('lat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="35.0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                経度
              </label>
              <input
                type="number"
                step="0.000001"
                value={editedSpot.location?.lng || ''}
                onChange={(e) => handleLocationChange('lng', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="135.0000"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              予算（円）
            </label>
            <input
              type="number"
              value={editedSpot.estimatedCost || ''}
              onChange={(e) => handleChange('estimatedCost', parseInt(e.target.value) || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
              min="0"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像URL
            </label>
            <input
              type="url"
              value={editedSpot.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={editedSpot.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="特記事項やメモを入力してください"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};