
import React from 'react';
import { SparklesIcon, BookmarkIcon, MapPinIcon } from '../components/icons';

const HomePage: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Your AI-Powered Travel Co-Pilot
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Stop searching, start exploring. Wanderly creates personalized travel itineraries in seconds, tailored to your interests and preferences.
          </p>
          <div className="mt-10">
            <a
              href="#/planner"
              className="inline-block bg-amber-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-amber-700 transition-colors shadow-lg"
            >
              Plan a Trip Now
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How Wanderly Works</h2>
            <p className="mt-4 text-lg text-gray-600">Travel planning, simplified.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="feature-item">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <SparklesIcon className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI-Magic Itineraries</h3>
              <p className="mt-2 text-gray-600">
                Tell us where you're going and what you love. Our AI crafts a unique, day-by-day plan just for you.
              </p>
            </div>
            <div className="feature-item">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <MapPinIcon className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Discover & Explore</h3>
              <p className="mt-2 text-gray-600">
                From famous landmarks to hidden gems, we find the best spots and organize them into a logical route.
              </p>
            </div>
            <div className="feature-item">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-amber-100 p-4 rounded-full">
                  <BookmarkIcon className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">All in One Place</h3>
              <p className="mt-2 text-gray-600">
                Get descriptions, times, and addresses for every activity. Your entire trip, neatly organized and ready to go.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
