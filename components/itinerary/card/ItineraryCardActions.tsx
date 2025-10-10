/**
 * Phase 9.6: ItineraryCardActions
 * 
 * しおりカードのアクションボタン
 */

'use client';

import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface ItineraryCardActionsProps {
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: 'default' | 'compact';
}

export const ItineraryCardActions: React.FC<ItineraryCardActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  variant = 'default',
}) => {
  if (variant === 'compact') {
    return (
      <div className="p-3 border-t flex items-center justify-between gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>表示</span>
        </button>
        
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="編集"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border-t flex items-center gap-2">
      <button
        onClick={onView}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span>詳細を見る</span>
      </button>
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
