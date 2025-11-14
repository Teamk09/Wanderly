import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import LoadingSpinner from "../components/LoadingSpinner";

const ProfilePage: React.FC = () => {
  const { user, initializing } = useAuth();
  const { profile, loading, saving, error, updateProfile } = useProfile();
  const [likes, setLikes] = useState<string>("");
  const [dislikes, setDislikes] = useState<string>("");
  const [visitedPlaces, setVisitedPlaces] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLikes(profile.likes);
    setDislikes(profile.dislikes);
    setVisitedPlaces(profile.visitedPlaces);
  }, [profile.likes, profile.dislikes, profile.visitedPlaces]);

  useEffect(() => {
    if (!initializing && !user) {
      window.location.hash = "#/login";
    }
  }, [user, initializing]);

  const hasChanges = useMemo(() => {
    return (
      likes !== profile.likes ||
      dislikes !== profile.dislikes ||
      visitedPlaces !== profile.visitedPlaces
    );
  }, [
    likes,
    dislikes,
    visitedPlaces,
    profile.likes,
    profile.dislikes,
    profile.visitedPlaces,
  ]);

  if (initializing || !user) {
    return null;
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) {
      return;
    }
    setFeedback(null);
    try {
      await updateProfile({ likes, dislikes, visitedPlaces });
      setFeedback("Preferences updated successfully.");
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Unable to save your profile."
      );
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full border-4 border-gray-700 mb-4 overflow-hidden bg-gray-700 flex items-center justify-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-3xl font-semibold text-gray-200">
                {user.name?.[0] ?? "?"}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-100">Your Profile</h1>
          <p className="text-gray-400 mt-2">{user.email}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 space-y-6"
        >
          <div>
            <label
              htmlFor="likes"
              className="block text-sm font-semibold text-gray-300 mb-2"
            >
              Likes & Preferences
            </label>
            <textarea
              id="likes"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Share what excites you most when traveling—food scenes, art, nightlife, hidden gems, etc."
            />
            <p className="text-xs text-gray-500 mt-2">
              This feeds directly into the Likes & Preferences field in the trip
              planner.
            </p>
          </div>

          <div>
            <label
              htmlFor="dislikes"
              className="block text-sm font-semibold text-gray-300 mb-2"
            >
              Dislikes & Blacklist
            </label>
            <textarea
              id="dislikes"
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Crowded spots, tourist traps, types of cuisine you avoid—anything Wanderly should skip."
            />
            <p className="text-xs text-gray-500 mt-2">
              Synced with the Dislikes & Blacklist input on the planner.
            </p>
          </div>

          <div>
            <label
              htmlFor="visitedPlaces"
              className="block text-sm font-semibold text-gray-300 mb-2"
            >
              Places I've Been
            </label>
            <textarea
              id="visitedPlaces"
              value={visitedPlaces}
              onChange={(e) => setVisitedPlaces(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="List cities, neighborhoods, or attractions you've already explored."
            />
            <p className="text-xs text-gray-500 mt-2">
              Wanderly will steer clear of recommending places you've already
              checked off.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500 bg-red-900/30 text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {feedback && !error && (
            <div className="rounded-xl border border-emerald-500 bg-emerald-900/30 text-emerald-200 px-4 py-3 text-sm">
              {feedback}
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            {(loading || saving) && <LoadingSpinner />}
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className="px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 disabled:bg-amber-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
