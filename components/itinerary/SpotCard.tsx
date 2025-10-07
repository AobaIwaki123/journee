'use client';

import React from 'react';
import { Spot } from '@/types/itinerary';
import { Clock, MapPin } from 'lucide-react';

interface SpotCardProps {
  spot: Spot;
}

export const SpotCard: React.FC<SpotCardProps> = ({ spot }) => {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
      {/* Time indicator */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full">
        <Clock className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">{spot.name}</h4>
            {spot.time && (
              <p className="text-sm text-gray-500 mt-1">{spot.time}</p>
            )}
          </div>
        </div>

        {spot.description && (
          <p className="text-sm text-gray-600 mt-2">{spot.description}</p>
        )}

        {spot.address && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{spot.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};
