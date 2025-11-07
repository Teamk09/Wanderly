import {
  GroundingChunk,
  Itinerary,
  SavedTrip,
  SuggestedIdea,
  UserPreferences,
} from "../types";

const STORAGE_KEY = "wanderly:savedTrips";
const PLANNER_SEED_KEY = "wanderly:plannerSeed";
const SELECTED_TRIP_KEY = "wanderly:selectedSavedTrip";

const defaultIdeas: SuggestedIdea[] = [
  {
    id: "idea-anime",
    title: "Anime Pilgrimage",
    description: "Visit studio landmarks, themed cafés, and anime hotspots.",
    location: "Tokyo, Japan",
    preferences: "anime studios, themed cafes, collectible shopping",
    dislikes: "crowded nightclubs",
    timeframe: "All day",
  },
  {
    id: "idea-music",
    title: "Music Pilgrimage",
    description:
      "Chase iconic venues, vinyl shops, and live house performances.",
    location: "Tokyo, Japan",
    preferences: "vinyl hunting, live music, indie venues",
    dislikes: "quiet museums",
    timeframe: "All day",
  },
  {
    id: "idea-foodie",
    title: "Hidden Cafés Crawl",
    description: "Hop between tucked-away cafés and dessert bars downtown.",
    location: "Tokyo, Japan",
    preferences: "third-wave coffee, patisseries, atmospheric lounges",
    dislikes: "tourist trap restaurants",
    timeframe: "All day",
  },
  {
    id: "idea-art",
    title: "Modern Art Dash",
    description: "Explore bold galleries, installations, and design boutiques.",
    location: "Tokyo, Japan",
    preferences: "modern art, design shops, river walk",
    dislikes: "sports events",
    timeframe: "All day",
  },
];

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("[savedTripsService] Failed to parse JSON", error);
    return fallback;
  }
};

const readTrips = (): SavedTrip[] => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  return safeParse<SavedTrip[]>(window.localStorage.getItem(STORAGE_KEY), []);
};

const writeTrips = (trips: SavedTrip[]): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
};

const createId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `trip_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const buildSignature = (
  itinerary: Itinerary,
  preferences: UserPreferences
): string => {
  const parts = [
    itinerary.title?.toLowerCase() ?? "",
    preferences.location?.toLowerCase() ?? "",
    (preferences.startDate || "").toLowerCase(),
    (preferences.timeframe || "").toLowerCase(),
  ];
  return parts.join("::");
};

const buildSummary = (itinerary: Itinerary): string | undefined => {
  const firstDay = itinerary.days[0];
  if (!firstDay) {
    return undefined;
  }
  const firstActivity = firstDay.activities?.[0];
  if (!firstActivity) {
    return undefined;
  }
  const pieces = [firstActivity.time, firstActivity.name]
    .filter(Boolean)
    .join(" • ");
  return pieces || firstActivity.description;
};

export const listSavedTrips = (): SavedTrip[] => readTrips();

export const removeSavedTrip = (id: string): void => {
  const existing = readTrips();
  const next = existing.filter((trip) => trip.id !== id);
  writeTrips(next);
};

export const saveGeneratedTrip = (params: {
  itinerary: Itinerary;
  preferences: UserPreferences;
  citations: GroundingChunk[];
}): SavedTrip => {
  const { itinerary, preferences, citations } = params;
  const signature = buildSignature(itinerary, preferences);
  const savedAt = new Date().toISOString();
  const existing = readTrips();
  const foundIndex = existing.findIndex((trip) => trip.signature === signature);

  const nextTrip: SavedTrip = {
    id: foundIndex >= 0 ? existing[foundIndex].id : createId(),
    signature,
    title: itinerary.title,
    location: preferences.location,
    startDate: preferences.startDate,
    timeframe: preferences.timeframe,
    preferences: preferences.preferences,
    dislikes: preferences.dislikes,
    summary: buildSummary(itinerary),
    savedAt,
    itinerary,
    citations: citations.length > 0 ? citations : undefined,
  };

  if (foundIndex >= 0) {
    existing.splice(foundIndex, 1, nextTrip);
    writeTrips(existing);
  } else {
    writeTrips([nextTrip, ...existing]);
  }

  return nextTrip;
};

export const isTripSaved = (
  itinerary: Itinerary,
  preferences: UserPreferences
): boolean => {
  const signature = buildSignature(itinerary, preferences);
  return readTrips().some((trip) => trip.signature === signature);
};

export const getSuggestedIdeas = (): SuggestedIdea[] => defaultIdeas;

export const clearPlannerSeed = (): void => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  window.sessionStorage.removeItem(PLANNER_SEED_KEY);
  window.sessionStorage.removeItem(SELECTED_TRIP_KEY);
};

export const setPlannerSeed = (seed: Partial<UserPreferences>): void => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  window.sessionStorage.setItem(PLANNER_SEED_KEY, JSON.stringify(seed));
};

export const consumePlannerSeed = (): Partial<UserPreferences> | null => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }
  const raw = window.sessionStorage.getItem(PLANNER_SEED_KEY);
  if (!raw) {
    return null;
  }
  window.sessionStorage.removeItem(PLANNER_SEED_KEY);
  return safeParse<Partial<UserPreferences>>(raw, null);
};

export const setSelectedTrip = (trip: SavedTrip): void => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  window.sessionStorage.setItem(SELECTED_TRIP_KEY, JSON.stringify(trip));
};

export const consumeSelectedTrip = (): SavedTrip | null => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }
  const raw = window.sessionStorage.getItem(SELECTED_TRIP_KEY);
  if (!raw) {
    return null;
  }
  window.sessionStorage.removeItem(SELECTED_TRIP_KEY);
  return safeParse<SavedTrip>(raw, null);
};
