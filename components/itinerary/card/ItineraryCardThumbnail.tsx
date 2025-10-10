/**
 * Phase 9.6: ItineraryCardThumbnail
 * 
 * しおりカードのサムネイル部分
 */

'use client';

import React from 'react';
import { MapPin, Calendar, Users } from 'lucide-react';

interface ItineraryCardThumbnailProps {
  destination: string;
  startDate?: string;
  duration?: number;
  participants?: number;
}

export const ItineraryCardThumbnail: React.FC<ItineraryCardThumbnailProps> = ({
  destination,
  startDate,
  duration,
  participants,
}) => {
  return (
    <div className="relative h-40 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-20" />
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="bg-white bg-opacity-90 rounded-lg px-3 py-1.5">
            <p className="text-xs font-medium text-gray-600">目的地</p>
            <p className="font-bold text-gray-900">{destination}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-white text-xs">
          {startDate && (
            <div className="flex items-center gap-1 bg-black bg-opacity-30 rounded px-2 py-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(startDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          {duration && (
            <div className="bg-black bg-opacity-30 rounded px-2 py-1">
              {duration}日間
            </div>
          )}
          {participants && (
            <div className="flex items-center gap-1 bg-black bg-opacity-30 rounded px-2 py-1">
              <Users className="w-3 h-3" />
              <span>{participants}人</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
