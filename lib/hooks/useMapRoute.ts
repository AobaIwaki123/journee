/**
 * Google Mapsルート描画フック
 */

import { useEffect, useRef } from "react";
import { TouristSpot } from "@/types/itinerary";

export function useMapRoute(
  map: google.maps.Map | null,
  spots: TouristSpot[],
  enabled: boolean
) {
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  useEffect(() => {
    if (!map || !enabled || spots.length < 2) {
      // Clear existing route
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // We already have custom markers
      polylineOptions: {
        strokeColor: "#3b82f6",
        strokeWeight: 3,
        strokeOpacity: 0.7,
      },
    });

    directionsRendererRef.current = directionsRenderer;

    const waypoints = spots.slice(1, -1).map((spot) => ({
      location: new google.maps.LatLng(spot.location!.lat, spot.location!.lng),
      stopover: true,
    }));

    directionsService.route(
      {
        origin: new google.maps.LatLng(
          spots[0].location!.lat,
          spots[0].location!.lng
        ),
        destination: new google.maps.LatLng(
          spots[spots.length - 1].location!.lat,
          spots[spots.length - 1].location!.lng
        ),
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
      ) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map, spots, enabled]);
}
