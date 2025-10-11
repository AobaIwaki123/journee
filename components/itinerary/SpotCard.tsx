'use client';

import React, { useState, useEffect, memo } from 'react';
import { TouristSpot } from '@/types/itinerary';
import { useSpotEditor } from '@/lib/hooks/itinerary';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryStore } from '@/lib/store/itinerary';
import { formatCurrency } from '@/lib/utils/currency';
import { 
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
  getCategoryGradient,
} from '@/lib/utils/category-utils';
import { SpotEditForm } from './SpotEditForm';
import { 
  Clock, 
  MapPin, 
  Wallet, 
  Info, 
  Edit2,
  Trash2,
  GripVertical
} from 'lucide-react';

interface SpotCardProps {
  spot: TouristSpot;
  editable?: boolean;
  dayIndex?: number;
  spotIndex?: number;
}

/**
 * Phase 7.2 & 10.3: 統合されたスポットカード（useUIStore使用）
 */
export const SpotCard: React.FC<SpotCardProps> = memo(({ 
  spot, 
  editable = false,
  dayIndex,
  spotIndex,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateSpot, deleteSpot, validateSpot } = useSpotEditor();
  const { addToast } = useUIStore();
  const { currentItinerary } = useItineraryStore();
  const currency = currentItinerary?.currency;

  // カテゴリ情報を取得
  const categoryLabel = getCategoryLabel(spot.category);
  const categoryColor = getCategoryColor(spot.category);
  const categoryGradient = getCategoryGradient(spot.category);
  const categoryIcon = getCategoryIcon(spot.category, 'w-5 h-5 text-white');

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // SpotEditForm内で更新済みなのでisEditingをfalseに
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (dayIndex === undefined || spotIndex === undefined) {
      console.error('dayIndex or spotIndex is undefined');
      return;
    }

    if (confirm(`「${spot.name}」を削除しますか？`)) {
      deleteSpot(dayIndex, spot.id);
      addToast('スポットを削除しました', 'info');
    }
  };

  if (isEditing && editable) {
    // 編集モード時は編集フォームを表示
    // TODO: SpotEditFormの統合または別の編集UIの実装
    setIsEditing(false);
    return null;
  }

  return (
    <div className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 relative">
      {editable && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className={`w-full md:w-2 flex-shrink-0 ${categoryGradient}`} />
        
        <div className="flex-1 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${categoryColor} flex items-center justify-center`}>
                {categoryIcon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-bold text-gray-900 text-base md:text-lg break-words">
                    {spot.name}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
                    {categoryLabel}
                  </span>
                </div>
                {spot.description && (
                  <p className="text-sm text-gray-600 mt-1 break-words">{spot.description}</p>
                )}
              </div>
            </div>

            {editable && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleEdit}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="編集"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {spot.scheduledTime && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm truncate">{spot.scheduledTime}</span>
              </div>
            )}

            {spot.duration && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm truncate">{spot.duration}</span>
              </div>
            )}

            {spot.location?.address && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm truncate">{spot.location.address}</span>
              </div>
            )}

            {spot.estimatedCost !== undefined && spot.estimatedCost > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Wallet className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-sm font-semibold truncate">
                  {formatCurrency(spot.estimatedCost, currency)}
                </span>
              </div>
            )}
          </div>

          {spot.notes && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 break-words">{spot.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SpotCard.displayName = 'SpotCard';
