'use client';

import React from 'react';
import { ItineraryData } from '@/types/itinerary';
import { Calendar, MapPin, DollarSign, Clock, Edit2 } from 'lucide-react';

interface ItineraryHeaderProps {
  itinerary: ItineraryData;
  onEdit?: () => void;
  isEditing?: boolean;
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({
  itinerary,
  onEdit,
  isEditing = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 relative">
      {/* Edit Button */}
      {onEdit && !isEditing && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
          aria-label="しおりを編集"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold mb-3 pr-12">{itinerary.title}</h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-blue-100 mb-4">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{itinerary.destination}</span>
        </div>

        {itinerary.startDate && itinerary.endDate && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {itinerary.startDate} - {itinerary.endDate}
            </span>
          </div>
        )}

        {itinerary.duration && (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{itinerary.duration}日間</span>
          </div>
        )}

        {itinerary.totalBudget && (
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>予算: ¥{itinerary.totalBudget.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {itinerary.summary && (
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
          <p className="text-blue-50 text-sm leading-relaxed">
            {itinerary.summary}
          </p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            itinerary.status === 'completed'
              ? 'bg-green-500/20 text-green-100'
              : itinerary.status === 'draft'
              ? 'bg-yellow-500/20 text-yellow-100'
              : 'bg-gray-500/20 text-gray-100'
          }`}
        >
          {itinerary.status === 'completed'
            ? '完成'
            : itinerary.status === 'draft'
            ? '作成中'
            : 'アーカイブ'}
        </span>
      </div>
    </div>
  );
};