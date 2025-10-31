import React from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="container mx-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={login}
            type="button"
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-3 px-4 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Continue with Google (Mock)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
