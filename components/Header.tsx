import React from "react";
import { GlobeIcon } from "./icons";
import { useAuth } from "../context/AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#/" className="flex items-center">
            <GlobeIcon className="h-8 w-8 text-amber-600" />
            <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Wanderly
            </span>
          </a>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  Welcome, {user.name}!
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="#/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  Login
                </a>
                <a
                  href="#/planner"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                >
                  Get Started
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
