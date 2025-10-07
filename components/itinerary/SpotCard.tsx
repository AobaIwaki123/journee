'use client';

import React from 'react';
import { TouristSpot } from '@/types/itinerary';
import { Clock, MapPin, DollarSign, Info } from 'lucide-react';

interface SpotCardProps {
  spot: TouristSpot;
}

const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    sightseeing: '観光',
    dining: '食事',
    transportation: '移動',
    accommodation: '宿泊',
    other: 'その他',
  };
  return category ? labels[category] || 'その他' : '';
};

const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    sightseeing: 'bg-blue-100 text-blue-700',
    dining: 'bg-orange-100 text-orange-700',
    transportation: 'bg-green-100 text-green-700',
    accommodation: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return category ? colors[category] || colors.other : colors.other;
};

export const SpotCard: React.FC<SpotCardProps> = ({ spot }) => {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Time indicator */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full">
        <Clock className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-800">{spot.name}</h4>
              {spot.category && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                    spot.category
                  )}`}
                >
                  {getCategoryLabel(spot.category)}
                </span>
              )}
            </div>
            {spot.scheduledTime && (
              <p className="text-sm text-gray-500 mt-1">
                {spot.scheduledTime}
                {spot.duration && ` (${spot.duration}分)`}
              </p>
            )}
          </div>
        </div>

        {spot.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {spot.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
          {spot.location?.address && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{spot.location.address}</span>
            </div>
          )}

          {spot.estimatedCost !== undefined && spot.estimatedCost > 0 && (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>¥{spot.estimatedCost.toLocaleString()}</span>
            </div>
          )}
        </div>

        {spot.notes && (
          <div className="flex items-start mt-2 p-2 bg-yellow-50 rounded text-sm text-gray-600">
            <Info className="w-4 h-4 mr-1 flex-shrink-0 text-yellow-600 mt-0.5" />
            <span>{spot.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
