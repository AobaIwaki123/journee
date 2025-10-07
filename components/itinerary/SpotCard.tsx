'use client';

import React, { useState } from 'react';
import { TouristSpot } from '@/types/itinerary';
import { Clock, MapPin, DollarSign, Info, Image as ImageIcon, Edit2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { EditSpotModal } from './EditSpotModal';

interface SpotCardProps {
  spot: TouristSpot;
  isEditable?: boolean;
  onEdit?: (spot: TouristSpot) => void;
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
  switch (category) {
    case 'sightseeing':
      return '🏛️';
    case 'dining':
      return '🍽️';
    case 'transportation':
      return '🚗';
    case 'accommodation':
      return '🏨';
    default:
      return '📍';
  }
};

export const SpotCard: React.FC<SpotCardProps> = ({ spot, isEditable = false, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = (editedSpot: TouristSpot) => {
    if (onEdit) {
      onEdit(editedSpot);
    }
  };

  const hasLocation = spot.location?.lat && spot.location?.lng;
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${spot.location!.lat},${spot.location!.lng}`
    : spot.location?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.location.address)}`
    : null;

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-start space-x-4 p-4">
        {/* Time indicator with category icon */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm">
            <span className="text-xl">{getCategoryIcon(spot.category)}</span>
          </div>
          {spot.scheduledTime && (
            <div className="mt-2 text-center">
              <p className="text-xs font-semibold text-gray-700">{spot.scheduledTime}</p>
              {spot.duration && (
                <p className="text-xs text-gray-500">{spot.duration}分</p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900 text-lg">{spot.name}</h4>
                {spot.category && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${getCategoryColor(
                      spot.category
                    )}`}
                  >
                    {getCategoryLabel(spot.category)}
                  </span>
                )}
              </div>
            </div>
            {isEditable && (
              <button
                onClick={handleEdit}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="編集"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Image */}
          {spot.imageUrl && !imageError && (
            <div className="mt-3 relative h-48 rounded-lg overflow-hidden">
              <Image
                src={spot.imageUrl}
                alt={spot.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {spot.description && (
            <p className={`text-sm text-gray-600 mt-3 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {spot.description}
            </p>
          )}

          {spot.description && spot.description.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
            >
              {isExpanded ? '閉じる' : '続きを読む'}
            </button>
          )}

          {/* Details */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {spot.location?.address && (
              <div className="flex items-center text-sm text-gray-600 group/location">
                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                <span className="truncate max-w-[200px]">{spot.location.address}</span>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-700 opacity-0 group-hover/location:opacity-100 transition-opacity"
                    aria-label="Google Mapsで開く"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {spot.estimatedCost !== undefined && spot.estimatedCost > 0 && (
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-1 flex-shrink-0 text-gray-400" />
                <span className="font-semibold text-blue-600">
                  ¥{spot.estimatedCost.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {spot.notes && (
            <div className="flex items-start mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg text-sm">
              <Info className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-600 mt-0.5" />
              <span className="text-gray-700">{spot.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditSpotModal
        spot={spot}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
