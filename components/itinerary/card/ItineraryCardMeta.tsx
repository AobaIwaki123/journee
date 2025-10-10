/**
 * Phase 9.6: ItineraryCardMeta
 * 
 * しおりカードのメタ情報部分
 */

'use client';

import React from 'react';
import { Clock, Eye } from 'lucide-react';

interface ItineraryCardMetaProps {
  title: string;
  summary?: string;
  updatedAt?: Date;
  viewCount?: number;
  statusBadge?: React.ReactNode;
}

export const ItineraryCardMeta: React.FC<ItineraryCardMetaProps> = ({
  title,
  summary,
  updatedAt,
  viewCount,
  statusBadge,
}) => {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1">
          {title || '無題のしおり'}
        </h3>
        {statusBadge}
      </div>
      
      {summary && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{summary}</p>
      )}
      
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {updatedAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(updatedAt).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
              })}更新
            </span>
          </div>
        )}
        {viewCount !== undefined && (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{viewCount}回閲覧</span>
          </div>
        )}
      </div>
    </div>
  );
};
