import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import SavedTripsPage from "./pages/SavedTripsPage";
import { AuthProvider } from "./context/AuthContext";

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    setRoute(window.location.hash);

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (route) {
      case "#/login":
        return <LoginPage />;
      case "#/planner":
        return <PlannerPage />;
      case "#/saved":
        return <SavedTripsPage />;
      case "#/":
      case "":
      default:
        return <HomePage />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200">
        <Header />
        <main className="flex-grow">{renderPage()}</main>
      </div>
    </AuthProvider>
  );
};

export default App;
