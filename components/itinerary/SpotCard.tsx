'use client';

import React, { useState, useEffect, memo } from 'react';
import { TouristSpot } from '@/types/itinerary';
import { useSpotEditor } from '@/lib/hooks/itinerary';
import { useStore } from '@/lib/store/useStore';
import { useItineraryStore } from '@/lib/store/itinerary';
import { formatCurrency } from '@/lib/utils/currency';
import { 
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
  getCategoryGradient,
} from '@/lib/utils/category-utils';
import { 
  Clock, 
  MapPin, 
  Wallet, 
  Info, 
  Edit2,
  Trash2,
  Check,
  X,
  GripVertical
} from 'lucide-react';

interface SpotCardProps {
  spot: TouristSpot;
  editable?: boolean;
  dayIndex?: number;
  spotIndex?: number;
  onEdit?: (updates: Partial<TouristSpot>) => void;
  onDelete?: () => void;
}

/**
 * Phase 7.1: SpotCard - カテゴリヘルパーを共通ユーティリティに移行
 */
export const SpotCard: React.FC<SpotCardProps> = memo(({ 
  spot, 
  editable = false,
  dayIndex,
  spotIndex,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editValues, setEditValues] = useState({
    name: spot.name,
    description: spot.description,
    scheduledTime: spot.scheduledTime || '',
    duration: spot.duration?.toString() || '',
    estimatedCost: spot.estimatedCost?.toString() || '',
    notes: spot.notes || '',
  });

  // ストアスライスから状態を取得
  const { currentItinerary } = useItineraryStore();
  const currency = currentItinerary?.currency;
  const addToast = useStore((state) => state.addToast);

  // カスタムHookを使用（editableの場合のみ）
  const { updateSpot, deleteSpot } = useSpotEditor();

  // spotのpropsが変更されたらeditValuesを更新
  useEffect(() => {
    setEditValues({
      name: spot.name,
      description: spot.description,
      scheduledTime: spot.scheduledTime || '',
      duration: spot.duration?.toString() || '',
      estimatedCost: spot.estimatedCost?.toString() || '',
      notes: spot.notes || '',
    });
  }, [spot]);

  const handleSave = () => {
    if (!editValues.name.trim()) {
      addToast('スポット名を入力してください', 'error');
      return;
    }

    const updates: Partial<TouristSpot> = {
      name: editValues.name.trim(),
      description: editValues.description.trim(),
      scheduledTime: editValues.scheduledTime.trim() || undefined,
      duration: editValues.duration ? parseInt(editValues.duration) : undefined,
      estimatedCost: editValues.estimatedCost ? parseInt(editValues.estimatedCost) : undefined,
      notes: editValues.notes.trim() || undefined,
    };

    // カスタムコールバックがある場合はそれを使用
    if (onEdit) {
      onEdit(updates);
    } else if (dayIndex !== undefined) {
      // カスタムHookを使用
      updateSpot(dayIndex, spot.id, updates);
    }

    setIsEditing(false);
    addToast('スポット情報を更新しました', 'success');
  };

  const handleCancel = () => {
    setEditValues({
      name: spot.name,
      description: spot.description,
      scheduledTime: spot.scheduledTime || '',
      duration: spot.duration?.toString() || '',
      estimatedCost: spot.estimatedCost?.toString() || '',
      notes: spot.notes || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    // カスタムコールバックがある場合はそれを使用
    if (onDelete) {
      onDelete();
    } else if (dayIndex !== undefined) {
      // カスタムHookを使用
      deleteSpot(dayIndex, spot.id);
    }

    addToast('スポットを削除しました', 'info');
    setShowDeleteConfirm(false);
  };

  // 編集モード表示
  if (isEditing && editable) {
    return (
      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-400 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900">スポット編集</h4>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="保存"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
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
              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
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
              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
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
                onChange={(e) => setEditValues({ ...editValues, scheduledTime: e.target.value })}
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
                onChange={(e) => setEditValues({ ...editValues, duration: e.target.value })}
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
              onChange={(e) => setEditValues({ ...editValues, estimatedCost: e.target.value })}
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
              onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="注意事項やメモを入力"
            />
          </div>
        </div>
      </div>
    );
  }

  // 通常表示モード
  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-300">
      {/* Drag Handle (editableの場合のみ) */}
      {editable && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Card Content */}
      <div className={`flex items-start gap-4 p-4 ${editable ? 'pl-8' : ''}`}>
        {/* Category Icon */}
        <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-br ${getCategoryGradient(spot.category)} text-white rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200`}>
          {getCategoryIcon(spot.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Category Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {spot.name}
                </h4>
                {spot.category && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getCategoryColor(
                      spot.category
                    )}`}
                  >
                    {getCategoryLabel(spot.category)}
                  </span>
                )}
              </div>

              {/* Time & Duration */}
              {spot.scheduledTime && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{spot.scheduledTime}</span>
                  {spot.duration && (
                    <span className="text-gray-500">({spot.duration}分)</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons (editableの場合のみ) */}
            {editable && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  title="編集"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {spot.description && (
            <p className={`text-sm text-gray-600 leading-relaxed mb-3 ${editable ? 'line-clamp-3' : 'line-clamp-3 group-hover:line-clamp-none'} transition-all`}>
              {spot.description}
            </p>
          )}

          {/* Location & Cost */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {spot.location?.address && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="truncate">{spot.location.address}</span>
              </div>
            )}

            {spot.estimatedCost !== undefined && spot.estimatedCost > 0 && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Wallet className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold">{formatCurrency(spot.estimatedCost, currency)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {spot.notes && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-900 leading-relaxed">{spot.notes}</span>
            </div>
          )}

          {/* Image */}
          {spot.imageUrl && !editable && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={spot.imageUrl} 
                alt={spot.name}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog (editableの場合のみ) */}
      {editable && showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 z-10 rounded-lg">
          <div className="text-center">
            <p className="text-gray-900 font-medium mb-4">
              このスポットを削除しますか？
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                削除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover Effect Border */}
      {!editable && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
});

SpotCard.displayName = 'SpotCard';
