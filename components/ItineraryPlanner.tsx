import React, { useState } from "react";
import { UserPreferences } from "../types";

interface ItineraryPlannerProps {
  onGenerate: (preferences: UserPreferences) => void;
  isLoading: boolean;
}

const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [location, setLocation] = useState<string>("Tokyo, Japan");
  const [preferences, setPreferences] = useState<string>(
    "ramen, anime culture, shrines, city pop music"
  );
  const [dislikes, setDislikes] = useState<string>(
    "nightclubs, overly crowded tourist traps"
  );
  const [duration, setDuration] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim() === "") {
      alert("Please enter a location.");
      return;
    }
    onGenerate({ location, preferences, dislikes, duration });
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
            htmlFor="duration"
            className="block text-sm font-medium text-gray-300"
          >
            Trip Duration ({duration} {duration > 1 ? "days" : "day"})
          </label>
          <input
            type="range"
            id="duration"
            min="1"
            max="7"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="mt-2 w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
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
            onChange={(e) => setPreferences(e.target.value)}
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
            onChange={(e) => setDislikes(e.target.value)}
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
