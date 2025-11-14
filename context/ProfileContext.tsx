import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { UserProfile } from "../types";
import { useAuth } from "./AuthContext";
import {
  createEmptyProfile,
  loadUserProfile,
  saveUserProfile,
  getCachedProfile,
} from "../services/profileService";

interface ProfileContextValue {
  profile: UserProfile;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>,
    options?: { persist?: boolean }
  ) => Promise<void> | void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [profile, setProfile] = useState<UserProfile>(() => getCachedProfile());
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef<UserProfile>(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(createEmptyProfile());
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await loadUserProfile(userId);
      setProfile(next);
    } catch (err) {
      console.warn("[ProfileContext] Failed to refresh profile", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile right now."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback<ProfileContextValue["updateProfile"]>(
    async (updates, options) => {
      if (!updates || Object.keys(updates).length === 0) {
        return;
      }
      const shouldPersist = options?.persist ?? true;
      const nextProfile: UserProfile = {
        ...profileRef.current,
        ...updates,
      };
      setProfile(nextProfile);
      if (!shouldPersist) {
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const saved = await saveUserProfile(nextProfile, userId);
        setProfile(saved);
      } catch (err) {
        console.warn("[ProfileContext] Failed to save profile", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save your profile right now."
        );
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, saving, error, refreshProfile, updateProfile }),
    [profile, loading, saving, error, refreshProfile, updateProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
