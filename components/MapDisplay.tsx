import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [googleReadyTick, setGoogleReadyTick] = useState(0);

  const appendDebug = useCallback((message: string, extra?: unknown) => {
    const timestamp = new Date().toISOString();
    const entry =
      extra !== undefined
        ? `${timestamp} ${message} :: ${JSON.stringify(extra)}`
        : `${timestamp} ${message}`;
    console.log("[MapDisplay]", message, extra ?? "");
    setDebugMessages((prev) => [...prev.slice(-19), entry]);
  }, []);

  useEffect(() => {
    appendDebug("Received locations", {
      count: locations.length,
      sample: locations.slice(0, 3).map((loc) => loc.address),
    });
  }, [locations, appendDebug]);

  useEffect(() => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setApiKeyError("API key is missing. The map cannot be displayed.");
      appendDebug("Missing GOOGLE_MAPS_API_KEY env var");
      return;
    }

    appendDebug("Attempting to load Google Maps script", {
      hasApiKey: Boolean(apiKey),
    });

    // Set up a global callback for Google Maps authentication failures
    window.gm_authFailure = () => {
      setApiKeyError(
        "Google Maps authentication failed. Please check if the API key is correct, has billing enabled, and is not restricted."
      );
      appendDebug("gm_authFailure triggered");
    };

    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`
    );
    if (existingScript) {
      appendDebug("Using existing Google Maps script tag");
      appendDebug("Existing script attributes", {
        async: existingScript.async,
        defer: existingScript.defer,
        type: existingScript.type || "text/javascript",
        readyState: (existingScript as any).readyState || "unknown",
      });
    }

    loadScript(scriptSrc)
      .then(() => {
        appendDebug("Google Maps script loaded successfully");
        setIsApiLoaded(true);
      })
      .catch((error) => {
        appendDebug("Google Maps script failed to load", {
          message: (error as Error).message,
        });
        setApiKeyError(
          "Failed to load Google Maps. Please check the API key and network connection."
        );
      });

    // Cleanup the global callback when the component unmounts
    return () => {
      if (window.gm_authFailure) {
        delete window.gm_authFailure;
      }
    };
  }, [appendDebug]);

  useEffect(() => {
    if (!isApiLoaded) {
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );
    if (script) {
      appendDebug("Google Maps script tag status", {
        async: script.async,
        defer: script.defer,
        type: script.type || "text/javascript",
        readyState: (script as any).readyState || "unknown",
        dataset: { ...script.dataset },
      });
    } else {
      appendDebug("Google Maps script tag not found after loadScript call");
    }

    const hasGoogle =
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined";

    if (hasGoogle) {
      appendDebug("window.google available; ready to initialize map");
      setGoogleReadyTick((tick) => tick + 1);
      return;
    }

    appendDebug("window.google still undefined; starting retry interval");

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      const ready =
        typeof window.google !== "undefined" &&
        typeof window.google.maps !== "undefined";

      if (ready) {
        appendDebug("window.google detected after retry", { attempts });
        setGoogleReadyTick((tick) => tick + 1);
        window.clearInterval(intervalId);
        return;
      }

      if (attempts === 1 || attempts === 5 || attempts === 10) {
        appendDebug("window.google still undefined on retry", { attempts });
      }

      if (attempts >= 20) {
        appendDebug("window.google not available after max retries", {
          attempts,
        });
        window.clearInterval(intervalId);
      }
    }, 300);

    return () => window.clearInterval(intervalId);
  }, [isApiLoaded, appendDebug]);

  useEffect(() => {
    // Guard against race condition where the script is loaded but window.google is not yet available
    if (
      isApiLoaded &&
      mapRef.current &&
      !map &&
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined"
    ) {
      appendDebug("Initializing Google Map instance");
      const mapOptions: any = {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      };

      const mapId = process.env.GOOGLE_MAPS_MAP_ID;
      if (mapId) {
        mapOptions.mapId = mapId;
        appendDebug("Applying custom mapId", { mapId });
      } else {
        mapOptions.styles = mapDarkStyle;
        appendDebug("Applying fallback dark style");
      }

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      appendDebug("Map instance created");
    } else if (isApiLoaded && typeof window.google === "undefined") {
      appendDebug("window.google is undefined after script load");
    }
  }, [isApiLoaded, map, appendDebug, googleReadyTick]);

  // Map uses provided map style configuration only once during initialization.

  useEffect(() => {
    if (!map || !isApiLoaded) return;

    appendDebug("Preparing markers for locations", { count: locations.length });
    markers.forEach((marker) => {
      if (typeof marker.setMap === "function") {
        marker.setMap(null);
      } else {
        marker.map = null;
      }
    });
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
          appendDebug("Geocode success", {
            address: location.address,
            resultCount: results?.length ?? 0,
          });
          if (results && results[0]) {
            return { location, result: results[0] };
          }
          throw new Error(`Geocode failed for address: "${location.address}"`);
        })
        .catch((error: Error) => {
          appendDebug("Geocode error", {
            address: location.address,
            message: error.message,
          });
          throw error;
        })
    );

    Promise.allSettled(geocodePromises).then((results) => {
      const newMarkers: any[] = [];
      const rejected = results.filter((r) => r.status === "rejected");
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

      appendDebug("Geocode batch completed", {
        successes: successfulGeocodes.length,
        failures: rejected.length,
      });

      if (successfulGeocodes.length === 0) {
        console.warn("Could not geocode any of the provided locations.");
        appendDebug("No geocoding results; map will reset view");
        return;
      }

      successfulGeocodes.forEach(({ location, result }) => {
        const latLng = result.geometry.location;
        bounds.extend(latLng);

        const marker = new window.google.maps.Marker({
          position: latLng,
          map,
          title: location.name,
        });

        appendDebug("Placed marker", {
          name: location.name,
          lat: latLng.lat?.() ?? latLng.lat,
          lng: latLng.lng?.() ?? latLng.lng,
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
        appendDebug("Adjusted map bounds to fit markers");
      } else {
        map.setCenter(bounds.getCenter());
        map.setZoom(14);
        appendDebug("Centered map on single marker", {
          zoom: 14,
        });
      }
    });
  }, [map, locations, isApiLoaded, appendDebug]);

  const hasLocations = locations.length > 0;
  const isDev = Boolean((import.meta as any).env?.DEV);

  if (apiKeyError) {
    return (
      <div className="bg-red-900/30 border-l-4 border-red-500 text-red-300 p-4 rounded-2xl shadow-lg h-64 md:h-96 flex flex-col justify-center">
        <h3 className="font-bold text-lg">Map Error</h3>
        <p>{apiKeyError}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-64 md:h-96 border border-gray-700">
      {!isApiLoaded && !hasLocations && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-100">Loading Map...</h3>
          </div>
        </div>
      )}
      {!isApiLoaded && hasLocations && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-100">
              Google Maps is loading…
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              Check console/debug panel below for status.
            </p>
          </div>
        </div>
      )}
      {isApiLoaded && !hasLocations && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-lg font-bold text-gray-100">Map</h3>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ display: hasLocations && isApiLoaded ? "block" : "none" }}
      />
      {isDev && debugMessages.length > 0 && (
        <div className="bg-gray-900/80 border-t border-gray-700 p-3 text-xs text-gray-300 overflow-y-auto max-h-40">
          <div className="font-semibold text-gray-200 mb-2">Map Debug Log</div>
          <ul className="space-y-1">
            {debugMessages.map((message, index) => (
              <li key={index} className="font-mono break-all">
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MapDisplay;
