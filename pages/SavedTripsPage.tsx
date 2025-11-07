import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ItineraryDisplay from "../components/ItineraryDisplay";
import { SavedTrip, SuggestedIdea } from "../types";
import {
  getSuggestedIdeas,
  listSavedTrips,
  removeSavedTrip,
  setPlannerSeed,
  setSelectedTrip,
  syncSavedTrips,
} from "../services/savedTripsService";

const SavedTripsPage: React.FC = () => {
  const { user, initializing } = useAuth();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const suggestedIdeas = useMemo<SuggestedIdea[]>(
    () => getSuggestedIdeas(),
    []
  );

  useEffect(() => {
    if (!initializing && !user) {
      window.location.hash = "#/login";
    }
  }, [user, initializing]);

  useEffect(() => {
    if (!user) {
      setSavedTrips([]);
      return;
    }
    setSavedTrips(listSavedTrips(user.uid));
    let isMounted = true;
    setIsSyncing(true);
    (async () => {
      try {
        const freshTrips = await syncSavedTrips(user.uid);
        if (isMounted) {
          setSavedTrips(freshTrips);
        }
      } catch (error) {
        console.warn("[SavedTripsPage] Failed to refresh trips", error);
        if (isMounted) {
          setFeedback({
            type: "error",
            message:
              "We could not refresh your saved trips. Showing what we have cached.",
          });
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const handleStorage = () => {
      setSavedTrips(listSavedTrips(user.uid));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (savedTrips.length === 0) {
      setSelectedTripId(null);
      return;
    }
    if (
      !selectedTripId ||
      !savedTrips.some((trip) => trip.id === selectedTripId)
    ) {
      setSelectedTripId(savedTrips[0].id);
    }
  }, [savedTrips, selectedTripId]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) {
      return null;
    }
    return savedTrips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [savedTrips, selectedTripId]);

  const handleViewTrip = useCallback((trip: SavedTrip) => {
    setSelectedTripId(trip.id);
    setFeedback({ type: "info", message: `Viewing "${trip.title}".` });
  }, []);

  const handleRemoveTrip = useCallback(
    async (trip: SavedTrip) => {
      try {
        await removeSavedTrip(trip.id, user?.uid);
        const updated = listSavedTrips(user?.uid);
        setSavedTrips(updated);
        setFeedback({
          type: "info",
          message: `Removed "${trip.title}" from saved trips.`,
        });
      } catch (error) {
        console.error("[SavedTripsPage] Failed to remove trip", error);
        setFeedback({
          type: "error",
          message: `We couldn't remove "${trip.title}". Please try again.`,
        });
      }
    },
    [user?.uid]
  );

  const handleResumeTrip = useCallback((trip: SavedTrip) => {
    setSelectedTrip(trip);
    window.location.hash = "#/planner";
  }, []);

  const handleIdeaClick = useCallback((idea: SuggestedIdea) => {
    const todayISO = new Date().toISOString().split("T")[0];
    setPlannerSeed({
      location: idea.location ?? "",
      preferences: idea.preferences ?? idea.description,
      dislikes: idea.dislikes ?? "",
      timeframe: idea.timeframe ?? "All day",
      startDate: todayISO,
    });
    window.location.hash = "#/planner";
  }, []);

  if (initializing) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-50">
          Your Saved Trips
        </h1>
        <p className="mt-3 text-gray-400 max-w-2xl">
          Pick up where you left off or browse inspiration for your next
          single-day adventure.
        </p>
      </header>

      {feedback && (
        <div
          className={`mb-8 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-500 bg-red-900/30 text-red-200"
              : "border-amber-500 bg-amber-900/30 text-amber-200"
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">
            Recently Saved {isSyncing ? "(Syncing...)" : ""}
          </h2>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Scroll →
          </span>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 pb-2">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 md:space-x-6 pb-4 min-w-max">
              {savedTrips.length > 0 ? (
                savedTrips.map((trip) => (
                  <article
                    key={trip.id}
                    className={`w-72 flex-shrink-0 rounded-2xl border ${
                      trip.id === selectedTripId
                        ? "border-amber-500"
                        : "border-gray-700"
                    } bg-gradient-to-br from-gray-800 to-gray-900 p-5 shadow-lg transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gray-50">
                        {trip.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrip(trip)}
                        className="text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-amber-300 font-medium">
                      {trip.location}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {trip.startDate ? trip.startDate : "Flexible date"}
                    </p>
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed overflow-hidden">
                      {trip.summary || "No highlights recorded yet."}
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewTrip(trip)}
                        className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResumeTrip(trip)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:border-amber-500 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Plan Again
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="w-72 flex-shrink-0 rounded-2xl border border-dashed border-gray-700 p-5 text-gray-400">
                  <p className="font-medium">No saved trips yet</p>
                  <p className="mt-2 text-sm">
                    Generate your first itinerary and tap "Save" to see it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">
            Build A Trip Around…
          </h2>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Scroll →
          </span>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 pb-2">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 md:space-x-6 pb-4 min-w-max">
              {suggestedIdeas.map((idea) => (
                <article
                  key={idea.id}
                  className="w-64 flex-shrink-0 rounded-2xl border border-gray-700 bg-gray-800/80 p-5 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-amber-300">
                    {idea.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                    {idea.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleIdeaClick(idea)}
                    className="mt-5 inline-flex items-center justify-center rounded-md border border-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:border-amber-500 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Start Planning
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {selectedTrip && (
        <section className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                {selectedTrip.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedTrip.location}
                {selectedTrip.startDate ? ` • ${selectedTrip.startDate}` : ""}
                {selectedTrip.timeframe ? ` • ${selectedTrip.timeframe}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleResumeTrip(selectedTrip)}
                className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Continue In Planner
              </button>
              <button
                type="button"
                onClick={() => handleRemoveTrip(selectedTrip)}
                className="inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:border-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Remove Trip
              </button>
            </div>
          </div>
          <ItineraryDisplay
            itinerary={selectedTrip.itinerary}
            citations={selectedTrip.citations ?? []}
          />
        </section>
      )}
    </div>
  );
};

export default SavedTripsPage;
