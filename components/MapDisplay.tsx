import React, { useEffect, useRef, useState } from "react";
import { ItineraryLocation } from "../types";

// Declare google for TypeScript to prevent type errors
declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

// Helper function to load the Google Maps script
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

interface MapDisplayProps {
  locations: ItineraryLocation[];
}

const MapDisplay: React.FC<MapDisplayProps> = ({ locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setApiKeyError("API key is missing. The map cannot be displayed.");
      return;
    }

    // Set up a global callback for Google Maps authentication failures
    window.gm_authFailure = () => {
      setApiKeyError(
        "Google Maps authentication failed. Please check if the API key is correct, has billing enabled, and is not restricted."
      );
    };

    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geocoding`;

    loadScript(scriptSrc)
      .then(() => setIsApiLoaded(true))
      .catch(() =>
        setApiKeyError(
          "Failed to load Google Maps. Please check the API key and network connection."
        )
      );

    // Cleanup the global callback when the component unmounts
    return () => {
      if (window.gm_authFailure) {
        delete window.gm_authFailure;
      }
    };
  }, []);

  useEffect(() => {
    // Guard against race condition where the script is loaded but window.google is not yet available
    if (
      isApiLoaded &&
      mapRef.current &&
      !map &&
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined"
    ) {
      const isDarkMode = document.documentElement.classList.contains("dark");
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapId: "WANDERLY_ITINERARY_MAP",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: isDarkMode ? mapDarkStyle : [],
      });
      setMap(newMap);
    }
  }, [isApiLoaded, map]);

  // Effect to update map style when theme changes
  useEffect(() => {
    if (map) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const isDarkMode = (
              mutation.target as HTMLElement
            ).classList.contains("dark");
            map.setOptions({ styles: isDarkMode ? mapDarkStyle : [] });
          }
        });
      });
      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
  }, [map]);

  useEffect(() => {
    if (!map || !isApiLoaded) return;

    markers.forEach((marker) => (marker.map = null));
    setMarkers([]);

    if (locations.length === 0) {
      map.setCenter({ lat: 20, lng: 0 });
      map.setZoom(2);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const infoWindow = new window.google.maps.InfoWindow();
    const bounds = new window.google.maps.LatLngBounds();

    const geocodePromises = locations.map((location) =>
      geocoder
        .geocode({ address: location.address })
        .then(({ results }: { results: any[] }) => {
          if (results && results[0]) {
            return { location, result: results[0] };
          }
          throw new Error(`Geocode failed for address: "${location.address}"`);
        })
    );

    Promise.allSettled(geocodePromises).then((results) => {
      const newMarkers: any[] = [];
      const successfulGeocodes = results
        .filter((r) => r.status === "fulfilled")
        .map(
          (r) =>
            (
              r as PromiseFulfilledResult<{
                location: ItineraryLocation;
                result: any;
              }>
            ).value
        );

      if (successfulGeocodes.length === 0) {
        console.warn("Could not geocode any of the provided locations.");
        return;
      }

      successfulGeocodes.forEach(({ location, result }) => {
        const latLng = result.geometry.location;
        bounds.extend(latLng);

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: latLng,
          map: map,
          title: location.name,
        });

        marker.addListener("click", () => {
          infoWindow.setContent(`
              <div style="font-family: 'Inter', sans-serif; padding: 2px; color: #1f2937;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0;">${location.name}</h3>
                <p style="font-size: 0.875rem; color: #4B5563; margin: 0;">${location.address}</p>
              </div>
            `);
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      });

      setMarkers(newMarkers);

      if (successfulGeocodes.length > 1) {
        map.fitBounds(bounds, 50);
      } else {
        map.setCenter(bounds.getCenter());
        map.setZoom(14);
      }
    });
  }, [map, locations, isApiLoaded]);

  const hasLocations = locations.length > 0;

  if (apiKeyError) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-2xl shadow-lg h-64 md:h-96 flex flex-col justify-center">
        <h3 className="font-bold text-lg">Map Error</h3>
        <p>{apiKeyError}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-64 md:h-96 border border-transparent dark:border-gray-700">
      {!isApiLoaded && !hasLocations && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Loading Map...
            </h3>
          </div>
        </div>
      )}
      {isApiLoaded && !hasLocations && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Map{" "}
            </h3>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ display: hasLocations && isApiLoaded ? "block" : "none" }}
      />
    </div>
  );
};

export default MapDisplay;
