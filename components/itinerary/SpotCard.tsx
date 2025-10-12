'use client';

import React, { memo } from 'react';
import { TouristSpot } from '@/types/itinerary';
import { useStore } from '@/lib/store/useStore';
import { formatCurrency } from '@/lib/utils/currency';
import { getDayColor } from '@/lib/utils/map-utils';
import { 
  Clock, 
  MapPin, 
  Wallet, 
  Info, 
  Camera,
  Utensils,
  Car,
  Hotel,
  Sparkles
} from 'lucide-react';

interface SpotCardProps {
  spot: TouristSpot;
  markerNumber?: number; // マップマーカー番号
  dayNumber?: number; // 日程番号（色表示用）
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
    sightseeing: 'bg-blue-100 text-blue-700 border-blue-200',
    dining: 'bg-orange-100 text-orange-700 border-orange-200',
    transportation: 'bg-green-100 text-green-700 border-green-200',
    accommodation: 'bg-purple-100 text-purple-700 border-purple-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return category ? colors[category] || colors.other : colors.other;
};

const getCategoryIcon = (category?: string) => {
  const iconClass = "w-5 h-5";
  const icons: Record<string, JSX.Element> = {
    sightseeing: <Camera className={iconClass} />,
    dining: <Utensils className={iconClass} />,
    transportation: <Car className={iconClass} />,
    accommodation: <Hotel className={iconClass} />,
    other: <Sparkles className={iconClass} />,
  };
  return category ? icons[category] || icons.other : icons.other;
};

const getCategoryGradient = (category?: string): string => {
  const gradients: Record<string, string> = {
    sightseeing: 'from-blue-400 to-blue-600',
    dining: 'from-orange-400 to-orange-600',
    transportation: 'from-green-400 to-green-600',
    accommodation: 'from-purple-400 to-purple-600',
    other: 'from-gray-400 to-gray-600',
  };
  return category ? gradients[category] || gradients.other : gradients.other;
};

export const SpotCard: React.FC<SpotCardProps> = memo(({ spot, markerNumber, dayNumber }) => {
  const currentItinerary = useStore((state: any) => state.currentItinerary);
  const currency = currentItinerary?.currency;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-300">
      {/* Card Content */}
      <div className="flex items-start gap-4 p-4">
        {/* Marker Number Badge */}
        {markerNumber !== undefined && dayNumber !== undefined && (
          <div
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: getDayColor(dayNumber) }}
            title={`マーカー番号: ${markerNumber}`}
          >
            {markerNumber}
          </div>
        )}

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
          </div>

          {/* Description */}
          {spot.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3 group-hover:line-clamp-none transition-all">
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
          {spot.imageUrl && (
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

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
});

SpotCard.displayName = 'SpotCard';
