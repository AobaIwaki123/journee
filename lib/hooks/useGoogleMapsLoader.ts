/**
 * Google Maps API読み込み専用フック
 */

import { useEffect, useState } from "react";

export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if Google Maps API is already available
    if (typeof google !== "undefined" && google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if API key is set
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps APIキーが設定されていません");
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError("Google Maps APIの読み込みに失敗しました");
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, error };
}
