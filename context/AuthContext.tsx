import React, { createContext, useState, useContext, ReactNode } from "react";
import { User } from "../types";
import { clearPlannerSeed } from "../services/savedTripsService";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    const mockUser: User = {
      name: "Wanderer",
      email: "hello@wanderly.app",
    };
    setUser(mockUser);
    clearPlannerSeed();
    window.location.hash = "#/saved";
  };

  const logout = () => {
    setUser(null);
    clearPlannerSeed();
    window.location.hash = "#/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
