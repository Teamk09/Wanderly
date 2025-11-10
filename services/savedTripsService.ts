import {
  GroundingChunk,
  Itinerary,
  SavedTrip,
  SuggestedIdea,
  UserPreferences,
} from "../types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebaseClient";

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

const getStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY}:${userId}` : `${STORAGE_KEY}:guest`;

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

const readTrips = (userId?: string): SavedTrip[] => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  const cached = window.localStorage.getItem(getStorageKey(userId));
  if (cached) {
    return safeParse<SavedTrip[]>(cached, []);
  }

  if (userId) {
    const legacy = window.localStorage.getItem(STORAGE_KEY);
    if (legacy) {
      const parsed = safeParse<SavedTrip[] | null>(legacy, null);
      if (parsed) {
        writeTrips(parsed, userId);
        window.localStorage.removeItem(STORAGE_KEY);
        return parsed;
      }
    }
  }

  return [];
};

const writeTrips = (trips: SavedTrip[], userId?: string): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(trips));
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

const getUserTripsCollection = (userId: string) =>
  collection(db, "users", userId, "trips");

const removeUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, entryValue]) => {
        if (entryValue === undefined) {
          return acc;
        }
        const cleaned = removeUndefinedDeep(entryValue);
        if (cleaned !== undefined) {
          acc[key] = cleaned;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  return value === undefined ? undefined : value;
};

export const listSavedTrips = (userId?: string): SavedTrip[] =>
  readTrips(userId);

export const syncSavedTrips = async (userId: string): Promise<SavedTrip[]> => {
  if (!userId) {
    return listSavedTrips();
  }

  try {
    const snapshot = await getDocs(getUserTripsCollection(userId));
    const remoteTrips: SavedTrip[] = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as Partial<SavedTrip>;
        if (!data.signature || !data.itinerary) {
          return null;
        }
        return {
          ...data,
          id: data.id ?? docSnapshot.id,
          signature: data.signature,
          title: data.title ?? "Untitled Trip",
          location: data.location ?? "",
          preferences: data.preferences ?? "",
          dislikes: data.dislikes ?? "",
          savedAt: data.savedAt ?? new Date().toISOString(),
          itinerary: data.itinerary as Itinerary,
          citations:
            (data.citations as GroundingChunk[] | undefined) ?? undefined,
        } as SavedTrip;
      })
      .filter((trip): trip is SavedTrip => Boolean(trip))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

    writeTrips(remoteTrips, userId);
    return remoteTrips;
  } catch (error) {
    console.warn("[savedTripsService] Failed to sync trips", error);
    throw error instanceof Error
      ? error
      : new Error("Unable to sync trips from the cloud.");
  }
};

export const removeSavedTrip = async (
  id: string,
  userId?: string
): Promise<void> => {
  const existing = readTrips(userId);
  const next = existing.filter((trip) => trip.id !== id);
  if (userId) {
    try {
      await deleteDoc(doc(db, "users", userId, "trips", id));
    } catch (error) {
      console.warn("[savedTripsService] Failed to remove remote trip", error);
      throw error instanceof Error
        ? error
        : new Error("Unable to remove trip from the cloud.");
    }
  }

  writeTrips(next, userId);
};

export const saveGeneratedTrip = async (
  params: {
    itinerary: Itinerary;
    preferences: UserPreferences;
    citations: GroundingChunk[];
  },
  userId?: string
): Promise<SavedTrip> => {
  const { itinerary, preferences, citations } = params;
  const signature = buildSignature(itinerary, preferences);
  const savedAt = new Date().toISOString();
  const existing = readTrips(userId);
  const foundIndex = existing.findIndex((trip) => trip.signature === signature);
  const summary = buildSummary(itinerary);

  const nextTrip: SavedTrip = {
    id: foundIndex >= 0 ? existing[foundIndex].id : createId(),
    signature,
    title: itinerary.title,
    location: preferences.location,
    startDate: preferences.startDate,
    preferences: preferences.preferences,
    dislikes: preferences.dislikes,
    savedAt,
    itinerary,
    ...(preferences.timeframe ? { timeframe: preferences.timeframe } : {}),
    ...(summary ? { summary } : {}),
    ...(citations.length > 0 ? { citations } : {}),
  };

  const sanitizedTrip = removeUndefinedDeep(nextTrip) as SavedTrip;

  const updatedTrips = [...existing];
  if (foundIndex >= 0) {
    updatedTrips.splice(foundIndex, 1, sanitizedTrip);
  } else {
    updatedTrips.unshift(sanitizedTrip);
  }

  if (userId) {
    try {
      await setDoc(
        doc(db, "users", userId, "trips", sanitizedTrip.id),
        sanitizedTrip
      );
    } catch (error) {
      console.warn("[savedTripsService] Failed to save trip remotely", error);
      throw error instanceof Error
        ? error
        : new Error("Unable to save trip to the cloud.");
    }
  }

  writeTrips(updatedTrips, userId);
  return sanitizedTrip;
};

export const isTripSaved = (
  itinerary: Itinerary,
  preferences: UserPreferences,
  userId?: string
): boolean => {
  const signature = buildSignature(itinerary, preferences);
  return readTrips(userId).some((trip) => trip.signature === signature);
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
