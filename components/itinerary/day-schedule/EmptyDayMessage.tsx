/**
 * Phase 9.4: EmptyDayMessage
 * 
 * スポットが空の日のメッセージ
 */

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface EmptyDayMessageProps {
  dayNumber: number;
  onRetry?: (dayNumber: number) => void;
}

export const EmptyDayMessage: React.FC<EmptyDayMessageProps> = ({
  dayNumber,
  onRetry,
}) => {
  return (
    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500 mb-4">
        この日のスポットはまだありません
      </p>
      {onRetry && (
        <button
          onClick={() => onRetry(dayNumber)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          もう一度詳細化する
        </button>
      )}
    </div>
  );
};
