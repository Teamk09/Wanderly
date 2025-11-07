import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { User } from "../types";
import { auth, googleProvider } from "../services/firebaseClient";
import {
  clearPlannerSeed,
  syncSavedTrips,
} from "../services/savedTripsService";

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const resolvedUser: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? firebaseUser.email ?? "Traveler",
          email: firebaseUser.email ?? "",
          photoURL: firebaseUser.photoURL ?? undefined,
        };
        setUser(resolvedUser);
        try {
          await syncSavedTrips(firebaseUser.uid);
        } catch (error) {
          console.warn("[AuthContext] Failed to sync trips for user", error);
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      clearPlannerSeed();
      window.location.hash = "#/saved";
    } catch (error) {
      console.error("[AuthContext] Login failed", error);
      throw error instanceof Error
        ? error
        : new Error("Login failed. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      clearPlannerSeed();
      window.location.hash = "#/";
    } catch (error) {
      console.error("[AuthContext] Logout failed", error);
      throw error instanceof Error
        ? error
        : new Error("Logout failed. Please try again.");
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, initializing, login, logout }),
    [user, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
