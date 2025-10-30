import React, { useState, useCallback, useEffect } from "react";
import ItineraryPlanner from "../components/ItineraryPlanner";
import ItineraryDisplay from "../components/ItineraryDisplay";
import MapDisplay from "../components/MapDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Itinerary,
  UserPreferences,
  ItineraryLocation,
  GroundingChunk,
} from "../types";
import { generateItinerary } from "../services/geminiService";
import { useAuth } from "../context/AuthContext";

const PlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<GroundingChunk[]>([]);

  useEffect(() => {
    if (!user) {
      window.location.hash = "#/login";
    }
  }, [user]);

  const handleGenerateItinerary = useCallback(
    async (preferences: UserPreferences) => {
      setIsLoading(true);
      setError(null);
      setItinerary(null);
      setCitations([]);
      try {
        const result = await generateItinerary(preferences);
        setItinerary(result.itinerary);
        setCitations(result.citations);
      } catch (err) {
        setError(
          err instanceof Error
            ? `Failed to generate itinerary: ${err.message}`
            : "An unknown error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLocationsForMap = (): ItineraryLocation[] => {
    if (!itinerary) return [];
    return itinerary.days.flatMap((day) => day.activities);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <ItineraryPlanner
            onGenerate={handleGenerateItinerary}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-8">
            <MapDisplay locations={getLocationsForMap()} />
            {isLoading && (
              <div className="w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[300px] border border-transparent dark:border-gray-700">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
                  Generating your adventure...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This can take up to a minute.
                </p>
              </div>
            )}
            {error && (
              <div
                className="w-full bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
                role="alert"
              >
                <strong className="font-bold">Oh no! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {itinerary && (
              <ItineraryDisplay itinerary={itinerary} citations={citations} />
            )}
            {!itinerary && !isLoading && !error && (
              <div className="w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[300px] text-center border border-transparent dark:border-gray-700">
                <div className="text-5xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Fill out the planner on the left to create your personalized
                  itinerary.
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
