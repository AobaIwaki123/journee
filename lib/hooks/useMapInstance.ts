/**
 * Google Maps地図インスタンス管理フック
 */

import { useEffect, useState, RefObject } from "react";

export function useMapInstance(
  mapRef: RefObject<HTMLDivElement>,
  isLoaded: boolean,
  center: { lat: number; lng: number },
  zoom: number
) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(newMap);
  }, [isLoaded, mapRef, center.lat, center.lng, zoom]);

  return map;
}
