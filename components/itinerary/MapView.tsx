'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DaySchedule } from '@/types/itinerary';
import { MapPin, AlertCircle } from 'lucide-react';

interface MapViewProps {
  days: DaySchedule[];
  selectedDay?: number;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({ 
  days, 
  selectedDay,
  height = '400px' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all spots with location data (memoized to prevent infinite loops)
  const spots = useMemo(() => {
    const spotsToShow = selectedDay !== undefined
      ? days.filter(day => day.day === selectedDay)
      : days;

    return spotsToShow.flatMap(day =>
      day.spots
        .filter(spot => spot.location?.lat && spot.location?.lng)
        .map(spot => ({
          ...spot,
          dayNumber: day.day,
        }))
    );
  }, [days, selectedDay]);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Google Maps API is available
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if API key is set
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps APIキーが設定されていません');
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Google Maps APIの読み込みに失敗しました');
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || spots.length === 0 || map) return;

    // Default center (Tokyo)
    const defaultCenter = { lat: 35.6762, lng: 139.6503 };
    
    // Calculate center based on spots
    const center = spots.length > 0
      ? {
          lat: spots.reduce((sum, spot) => sum + (spot.location?.lat || 0), 0) / spots.length,
          lng: spots.reduce((sum, spot) => sum + (spot.location?.lng || 0), 0) / spots.length,
        }
      : defaultCenter;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom: spots.length > 1 ? 12 : 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(newMap);
  }, [isLoaded, spots.length, map]);

  // Add markers
  useEffect(() => {
    if (!map || spots.length === 0) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = spots.map((spot, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: spot.location!.lat,
          lng: spot.location!.lng,
        },
        map,
        title: spot.name,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        animation: google.maps.Animation.DROP,
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
              ${spot.name}
            </h3>
            ${selectedDay === undefined ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Day ${spot.dayNumber}</p>` : ''}
            ${spot.description ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #4b5563;">${spot.description}</p>` : ''}
            ${spot.scheduledTime ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">⏰ ${spot.scheduledTime}</p>` : ''}
            ${spot.estimatedCost ? `<p style="margin: 0; font-size: 12px; color: #2563eb;">💰 ¥${spot.estimatedCost.toLocaleString()}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    }

    // Draw route if multiple spots
    if (newMarkers.length > 1 && selectedDay !== undefined) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // We already have custom markers
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 3,
          strokeOpacity: 0.7,
        },
      });

      const waypoints = spots.slice(1, -1).map(spot => ({
        location: new google.maps.LatLng(spot.location!.lat, spot.location!.lng),
        stopover: true,
      }));

      directionsService.route(
        {
          origin: new google.maps.LatLng(spots[0].location!.lat, spots[0].location!.lng),
          destination: new google.maps.LatLng(
            spots[spots.length - 1].location!.lat,
            spots[spots.length - 1].location!.lng
          ),
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
          }
        }
      );
    }

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, spots, selectedDay]);

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-500 mt-1">
          環境変数に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
        </p>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">位置情報が設定されたスポットがありません</p>
        <p className="text-xs text-gray-500 mt-1">
          AIチャットで「地図に表示したい」と伝えて位置情報を追加してみましょう
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-300 shadow-md">
      <div ref={mapRef} style={{ height }} />
      {selectedDay !== undefined && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
          <p className="text-sm font-semibold text-gray-700">Day {selectedDay}</p>
          <p className="text-xs text-gray-500">{spots.length} スポット</p>
        </div>
      )}
    </div>
  );
};