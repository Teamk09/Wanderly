import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile } from "../types";
import { db } from "./firebaseClient";

const PROFILE_STORAGE_KEY = "wanderly:userProfile";
const PROFILE_DOC_ID = "default";

const getStorageKey = (userId?: string) =>
  userId ? `${PROFILE_STORAGE_KEY}:${userId}` : `${PROFILE_STORAGE_KEY}:guest`;

const sanitizeField = (value?: string): string =>
  typeof value === "string" ? value.trim() : "";

export const createEmptyProfile = (): UserProfile => ({
  likes: "",
  dislikes: "",
  visitedPlaces: "",
  updatedAt: new Date().toISOString(),
});

const normalizeProfile = (
  profile?: Partial<UserProfile> | null
): UserProfile => {
  const fallback = createEmptyProfile();
  if (!profile) {
    return fallback;
  }
  return {
    likes: sanitizeField(profile.likes ?? fallback.likes),
    dislikes: sanitizeField(profile.dislikes ?? fallback.dislikes),
    visitedPlaces: sanitizeField(
      profile.visitedPlaces ?? fallback.visitedPlaces
    ),
    updatedAt: profile.updatedAt ?? fallback.updatedAt,
  };
};

const readCachedProfile = (userId?: string): UserProfile | null => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  const cached = window.localStorage.getItem(getStorageKey(userId));
  if (!cached) {
    return null;
  }
  try {
    const parsed = JSON.parse(cached) as Partial<UserProfile>;
    return normalizeProfile(parsed);
  } catch (error) {
    console.warn("[profileService] Failed to parse cached profile", error);
    return null;
  }
};

const cacheProfile = (profile: UserProfile, userId?: string): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(profile));
};

const getProfileDocRef = (userId: string) =>
  doc(db, "users", userId, "profile", PROFILE_DOC_ID);

export const clearProfileCache = (userId?: string): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(getStorageKey(userId));
};

export const loadUserProfile = async (
  userId?: string
): Promise<UserProfile> => {
  const cached = readCachedProfile(userId);

  if (!userId) {
    return cached ?? createEmptyProfile();
  }

  try {
    const snapshot = await getDoc(getProfileDocRef(userId));
    if (snapshot.exists()) {
      const normalized = normalizeProfile(snapshot.data() as UserProfile);
      cacheProfile(normalized, userId);
      return normalized;
    }
  } catch (error) {
    console.warn("[profileService] Failed to load remote profile", error);
  }

  if (cached) {
    return cached;
  }

  return createEmptyProfile();
};

export const saveUserProfile = async (
  updates: Partial<UserProfile>,
  userId?: string
): Promise<UserProfile> => {
  const cached = readCachedProfile(userId);
  const merged = normalizeProfile({ ...cached, ...updates });
  const stamped: UserProfile = {
    ...merged,
    updatedAt: new Date().toISOString(),
  };

  cacheProfile(stamped, userId);

  if (userId) {
    try {
      await setDoc(getProfileDocRef(userId), stamped, { merge: true });
    } catch (error) {
      console.warn("[profileService] Failed to save remote profile", error);
      throw error instanceof Error
        ? error
        : new Error("Unable to save profile to the cloud.");
    }
  }

  return stamped;
};

export const getCachedProfile = (userId?: string): UserProfile =>
  readCachedProfile(userId) ?? createEmptyProfile();
