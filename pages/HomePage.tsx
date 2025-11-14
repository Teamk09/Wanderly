import React from "react";
import bgImage from "../images/00_generic_facebook-001.jpg";
import fujiImg from "../images/fuji.jpg";
import templeImg from "../images/newTemple.webp";
import towerImg from "../images/tower.jpg";

const HomePage: React.FC = () => {
  return (
    <>
      <div
        className="bg-cover bg-center min-h-screen"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white-900 leading-tight">
            Itineraries Made Simple
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white-600 max-w-3xl mx-auto">
            Stop searching, start exploring. Wanderly creates personalized
            travel itineraries in seconds, tailored to your interests and
            preferences.
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
        <div className="h-[40vh] -mt-12 md:-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="h-full flex items-center">
              <div className="w-full flex gap-6">
                <div className="flex-1 h-full overflow-hidden rounded-lg border-2 border-amber-600 relative group">
                  <img
                    src={fujiImg}
                    alt="Explore Mt. Fuji"
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute inset-0 bg-amber-600 flex flex-col items-center justify-center text-center px-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-lg font-bold text-white">
                      Explore Mt. Fuji
                    </h3>
                    <p className="text-sm text-white max-w-[90%]">
                      Enjoy scenic views and nature at the Fuji Five Lakes,
                      visit cultural sites like the Chureito Pagoda and Oshino
                      Hakkai, or relax at an onsen
                    </p>
                  </div>
                </div>
                <div className="flex-1 h-full overflow-hidden rounded-lg border-2 border-amber-600 relative group">
                  <img
                    src={templeImg}
                    alt="Temple"
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute inset-0 bg-amber-600 flex flex-col items-center justify-center text-center px-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-lg font-bold text-white">
                      Explore Historic Temple
                    </h3>
                    <p className="text-sm text-white max-w-[90%]">
                      There are an estimated 160,000 temples and shrines in
                      Japan
                    </p>
                  </div>
                </div>
                <div className="flex-1 h-full overflow-hidden rounded-lg border-2 border-amber-600 relative group">
                  <img
                    src={towerImg}
                    alt="Tower"
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute inset-0 bg-amber-600 flex flex-col items-center justify-center text-center px-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-lg font-bold text-white">
                      Explore Cities
                    </h3>
                    <p className="text-sm text-white max-w-[90%]">
                      Visit the most busy city in the world and enage in
                      shopping, dining, and nightlife
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Curious what Wanderly is about?
            </h2>
            <p className="text-base text-gray-300 leading-relaxed">
              Learn more about our mission, the story behind Wanderly, and meet
              the people building it!
            </p>
            <a
              href="#/about"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              Visit the About Page
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;
