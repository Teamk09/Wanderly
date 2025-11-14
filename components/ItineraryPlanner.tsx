import React, { useEffect, useRef, useState } from "react";
import { UserPreferences } from "../types";

interface ItineraryPlannerProps {
  onGenerate: (preferences: UserPreferences) => void;
  isLoading: boolean;
  seed?: Partial<UserPreferences> | null;
  onSeedConsumed?: () => void;
  profileDefaults?: {
    preferences?: string;
    dislikes?: string;
  };
}

const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  onGenerate,
  isLoading,
  seed,
  onSeedConsumed,
  profileDefaults,
}) => {
  const DEFAULT_LOCATION = "Tokyo, Japan";
  const DEFAULT_PREFERENCES = "ramen, anime culture, shrines, city pop music";
  const DEFAULT_DISLIKES = "nightclubs, overly crowded tourist traps";

  const [location, setLocation] = useState<string>(DEFAULT_LOCATION);
  const [preferences, setPreferences] = useState<string>(DEFAULT_PREFERENCES);
  const [dislikes, setDislikes] = useState<string>(DEFAULT_DISLIKES);
  const [timeframe, setTimeframe] = useState<string>("All day");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - tzOffset * 60000);
    return localDate.toISOString().split("T")[0];
  });
  const lastSeedRef = useRef<string>("");
  const preferencesTouchedRef = useRef<boolean>(false);
  const dislikesTouchedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!seed) {
      return;
    }
    const serialized = JSON.stringify(seed);
    if (serialized === lastSeedRef.current) {
      return;
    }
    lastSeedRef.current = serialized;
    if (typeof seed.location === "string" && seed.location.trim().length > 0) {
      setLocation(seed.location);
    }
    if (typeof seed.preferences === "string") {
      setPreferences(seed.preferences);
      preferencesTouchedRef.current = true;
    }
    if (typeof seed.dislikes === "string") {
      setDislikes(seed.dislikes);
      dislikesTouchedRef.current = true;
    }
    if (
      typeof seed.startDate === "string" &&
      seed.startDate.trim().length > 0
    ) {
      setStartDate(seed.startDate);
    }
    if (
      typeof seed.timeframe === "string" &&
      seed.timeframe.trim().length > 0
    ) {
      setTimeframe(seed.timeframe);
    }
    onSeedConsumed?.();
  }, [seed, onSeedConsumed]);

  useEffect(() => {
    if (!profileDefaults) {
      return;
    }
    if (profileDefaults.preferences && !preferencesTouchedRef.current) {
      setPreferences(profileDefaults.preferences);
    }
    if (profileDefaults.dislikes && !dislikesTouchedRef.current) {
      setDislikes(profileDefaults.dislikes);
    }
  }, [profileDefaults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim() === "") {
      alert("Please enter a location.");
      return;
    }
    onGenerate({ location, preferences, dislikes, startDate, timeframe });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Plan Your Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-300"
          >
            Destination
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="e.g., Paris, France"
            required
          />
        </div>
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-300"
          >
            First Day of Trip
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="timeframe"
            className="block text-sm font-medium text-gray-300"
          >
            Preferred Timeframe
          </label>
          <input
            type="text"
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="e.g., 9:00 AM - 3:00 PM"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave as "All day" to cover morning through evening, or provide a
            time window like "10:00 AM - 6:00 PM".
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Trips are limited to a single day for now. Need more time? Generate
          additional itineraries for each day you plan to travel.
        </p>
        <div>
          <label
            htmlFor="preferences"
            className="block text-sm font-medium text-gray-300"
          >
            Likes & Preferences
          </label>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(e) => {
              preferencesTouchedRef.current = true;
              setPreferences(e.target.value);
            }}
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="e.g., art museums, hiking, street food"
          />
        </div>
        <div>
          <label
            htmlFor="dislikes"
            className="block text-sm font-medium text-gray-300"
          >
            Dislikes & Blacklist
          </label>
          <textarea
            id="dislikes"
            value={dislikes}
            onChange={(e) => {
              dislikesTouchedRef.current = true;
              setDislikes(e.target.value);
            }}
            rows={2}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="e.g., crowded places, shopping malls"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Creating..." : "Generate Itinerary"}
          {/* icon removed per request */}
        </button>
      </form>
    </div>
  );
};

export default ItineraryPlanner;
