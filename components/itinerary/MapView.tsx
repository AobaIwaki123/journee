"use client";

import React, { useState, useMemo } from 'react';
import { Map, Eye } from 'lucide-react';
import { useMapInstance } from '@/lib/hooks/useMapInstance';
import { useMapMarkers } from '@/lib/hooks/useMapMarkers';
import { useMapRoute } from '@/lib/hooks/useMapRoute';
import { useGoogleMapsLoader } from '@/lib/hooks/useGoogleMapsLoader';
import { DaySchedule, TouristSpot } from '@/types/itinerary';

interface MapViewProps {
  days: DaySchedule[];
  selectedDay?: number;
  height?: string;
  showDaySelector?: boolean;
  numberingMode?: "global" | "perDay";
}

/**
 * Phase 12.1: MapView（メモ化版）
 */
export const MapView = React.memo<MapViewProps>(({ 
  days, 
  selectedDay: initialSelectedDay, 
  height = '600px',
  showDaySelector = true,
  numberingMode = 'global'
}) => {
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay || 1);
  const { isLoaded, error } = useGoogleMapsLoader();

  const spots = useMemo(() => {
    const dayData = days.find(d => d.day === selectedDay);
    return dayData?.spots || [];
  }, [days, selectedDay]);

  const center = useMemo(() => {
    if (spots.length > 0 && spots[0].location) {
      return {
        lat: spots[0].location.lat,
        lng: spots[0].location.lng,
      };
    }
    return { lat: 35.6762, lng: 139.6503 };
  }, [spots]);

  const { mapRef } = useMapInstance({ center, zoom: 13 });
  useMapMarkers(mapRef, spots, numberingMode, selectedDay);
  useMapRoute(mapRef, spots);

  const availableDays = days.filter(day => 
    day.spots.some(spot => spot.location?.lat && spot.location?.lng)
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <Map className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">地図の読み込みに失敗しました</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <Map className="w-16 h-16 text-blue-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-medium">地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {showDaySelector && availableDays.length > 1 && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Eye className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">表示する日:</span>
            <div className="flex gap-2">
              {availableDays.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                    selectedDay === day.day
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <div
          ref={mapRef}
          style={{ height: height || '100%' }}
          className="w-full"
        />
        
        {spots.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              Day {selectedDay}
            </p>
            <p className="text-xs text-gray-500">{spots.length} スポット</p>
          </div>
        )}
      </div>
    </div>
  );
});

MapView.displayName = 'MapView';
