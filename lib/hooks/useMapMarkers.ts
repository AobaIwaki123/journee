/**
 * Google Mapsマーカー管理フック
 */

import { useEffect, useRef } from "react";
import { PreparedMarkerData } from "@/lib/utils/map-utils";

interface UseMapMarkersOptions {
  map: google.maps.Map | null;
  markerData: PreparedMarkerData[];
  numberingMode: "global" | "perDay";
  showDay: boolean; // InfoWindowに日程を表示するか
}

export function useMapMarkers({
  map,
  markerData,
  numberingMode,
  showDay,
}: UseMapMarkersOptions) {
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map || markerData.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers = markerData.map((data) => {
      const { spot, dayNumber, globalIndex, dayIndex, color } = data;
      const markerNumber = numberingMode === "global" ? globalIndex : dayIndex;

      const marker = new google.maps.Marker({
        position: {
          lat: spot.location!.lat,
          lng: spot.location!.lng,
        },
        map,
        title: spot.name,
        label: {
          text: `${markerNumber}`,
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 12,
          labelOrigin: new google.maps.Point(0, 0),
        },
        animation: google.maps.Animation.DROP,
      });

      // Info window
      const infoContent = `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            ${markerNumber}. ${spot.name}
          </h3>
          ${
            showDay
              ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Day ${dayNumber}</p>`
              : ""
          }
          ${
            spot.description
              ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #4b5563;">${spot.description}</p>`
              : ""
          }
          ${
            spot.scheduledTime
              ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">⏰ ${spot.scheduledTime}</p>`
              : ""
          }
          ${
            spot.estimatedCost
              ? `<p style="margin: 0; font-size: 12px; color: #2563eb;">💰 ¥${spot.estimatedCost.toLocaleString()}</p>`
              : ""
          }
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Fit bounds to show all markers
    if (newMarkers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((marker) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    }

    return () => {
      newMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [map, markerData, numberingMode, showDay]);
}
