import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login, user, initializing } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && user) {
      window.location.hash = "#/saved";
    }
  }, [user, initializing]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      console.error("[LoginPage] Login failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "We could not sign you in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  return (
    <div className="container mx-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Use your Google account to sync itineraries across devices.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md border border-red-400 bg-red-900/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            type="button"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-3 px-4 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {isLoading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
