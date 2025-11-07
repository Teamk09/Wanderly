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
  SavedTrip,
} from "../types";
import { generateItinerary } from "../services/geminiService";
import { useAuth } from "../context/AuthContext";
import {
  consumePlannerSeed,
  consumeSelectedTrip,
  isTripSaved,
  saveGeneratedTrip,
} from "../services/savedTripsService";

const PlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<GroundingChunk[]>([]);
  const [activePreferences, setActivePreferences] =
    useState<UserPreferences | null>(null);
  const [plannerSeed, setPlannerSeedState] =
    useState<Partial<UserPreferences> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [tripIsSaved, setTripIsSaved] = useState(false);

  const hydrateFromSavedTrip = useCallback((trip: SavedTrip) => {
    setIsLoading(false);
    setError(null);
    setItinerary(trip.itinerary);
    setCitations(trip.citations ?? []);
    const fallbackDate = new Date().toISOString().split("T")[0];
    const hydratedPreferences: UserPreferences = {
      location: trip.location,
      preferences: trip.preferences,
      dislikes: trip.dislikes,
      startDate: trip.startDate ?? fallbackDate,
      timeframe: trip.timeframe || "All day",
    };
    setActivePreferences(hydratedPreferences);
    setPlannerSeedState(hydratedPreferences);
    setTripIsSaved(true);
    setSaveFeedback({
      type: "success",
      message: "Loaded itinerary from your saved trips.",
    });
  }, []);

  useEffect(() => {
    if (!user) {
      window.location.hash = "#/login";
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const selectedTrip = consumeSelectedTrip();
    if (selectedTrip) {
      hydrateFromSavedTrip(selectedTrip);
      return;
    }

    const seed = consumePlannerSeed();
    if (seed) {
      setPlannerSeedState(seed);
    }
  }, [user, hydrateFromSavedTrip]);

  const handleGenerateItinerary = useCallback(
    async (preferences: UserPreferences) => {
      setIsLoading(true);
      setError(null);
      setItinerary(null);
      setCitations([]);
      setActivePreferences({ ...preferences });
      setSaveFeedback(null);
      setTripIsSaved(false);
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

  useEffect(() => {
    if (!itinerary || !activePreferences) {
      setTripIsSaved(false);
      return;
    }
    setTripIsSaved(isTripSaved(itinerary, activePreferences));
  }, [itinerary, activePreferences]);

  useEffect(() => {
    if (!saveFeedback) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSaveFeedback(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  const handleSaveTrip = useCallback(() => {
    if (!itinerary || !activePreferences) {
      return;
    }
    if (tripIsSaved) {
      setSaveFeedback({
        type: "success",
        message: "This itinerary is already in your saved trips.",
      });
      return;
    }
    try {
      setIsSaving(true);
      const saved = saveGeneratedTrip({
        itinerary,
        preferences: activePreferences,
        citations,
      });
      setTripIsSaved(true);
      setSaveFeedback({
        type: "success",
        message: `Saved "${saved.title}" to your trips.`,
      });
    } catch (err) {
      setSaveFeedback({
        type: "error",
        message:
          err instanceof Error
            ? `Could not save this itinerary: ${err.message}`
            : "Could not save this itinerary.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [itinerary, activePreferences, citations, tripIsSaved]);

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
            seed={plannerSeed}
            onSeedConsumed={() => setPlannerSeedState(null)}
          />
        </div>
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-8">
            <MapDisplay locations={getLocationsForMap()} />
            {isLoading && (
              <div className="w-full bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[300px] border border-gray-700">
                <LoadingSpinner />
                <p className="mt-4 text-gray-300 font-medium">
                  Generating your adventure...
                </p>
                <p className="text-sm text-gray-400">
                  This can take up to a minute.
                </p>
              </div>
            )}
            {error && (
              <div
                className="w-full bg-red-900/30 border border-red-400 text-red-300 px-4 py-3 rounded-lg"
                role="alert"
              >
                <strong className="font-bold">Oh no! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {itinerary && (
              <div className="flex flex-col gap-4">
                <div className="w-full bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100">
                      Your Itinerary
                    </h2>
                    {activePreferences && (
                      <p className="text-sm text-gray-400 mt-1">
                        {activePreferences.location} •{" "}
                        {activePreferences.startDate}
                        {activePreferences.timeframe
                          ? ` • ${activePreferences.timeframe}`
                          : ""}
                      </p>
                    )}
                    {tripIsSaved && (
                      <p className="text-xs font-medium text-amber-300 mt-2">
                        Already saved in your library.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveTrip}
                      disabled={isSaving || tripIsSaved}
                      className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:bg-amber-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      {tripIsSaved
                        ? "Saved"
                        : isSaving
                        ? "Saving..."
                        : "Save Trip"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "#/saved";
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:border-amber-500 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      View Library
                    </button>
                  </div>
                </div>
                {saveFeedback && (
                  <div
                    className={`w-full rounded-lg border px-4 py-3 text-sm ${
                      saveFeedback.type === "success"
                        ? "border-emerald-500 bg-emerald-900/30 text-emerald-200"
                        : "border-red-500 bg-red-900/30 text-red-200"
                    }`}
                    role="status"
                  >
                    {saveFeedback.message}
                  </div>
                )}
                <ItineraryDisplay itinerary={itinerary} citations={citations} />
              </div>
            )}
            {!itinerary && !isLoading && !error && (
              <div className="w-full bg-gray-800 p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[300px] text-center border border-gray-700">
                <div className="text-5xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold text-gray-100">
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
