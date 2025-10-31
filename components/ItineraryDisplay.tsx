import React from "react";
import { Itinerary, GroundingChunk } from "../types";

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  citations: GroundingChunk[];
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({
  itinerary,
  citations,
}) => {
  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-700">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
        {itinerary.title}
      </h1>
      <div className="space-y-8 mt-6">
        {itinerary.days.map((day) => (
          <div key={day.day}>
            <div className="flex items-center mb-4">
              <span className="bg-amber-900/50 text-amber-300 text-sm font-bold mr-3 px-3 py-1.5 rounded-full">
                Day {day.day}
              </span>
              <h3 className="text-xl font-semibold text-gray-200">
                {day.theme}
              </h3>
            </div>
            <div className="border-l-2 border-amber-800 pl-6 space-y-6">
              {day.activities.map((activity, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[34px] top-1 h-4 w-4 rounded-full bg-amber-500 ring-4 ring-gray-800"></div>
                  <p className="font-bold text-gray-400">{activity.time}</p>
                  <h4 className="font-semibold text-lg text-gray-100 mt-1">
                    {activity.name}
                  </h4>
                  <p className="text-gray-400 mt-1">{activity.description}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-400">
                    <span className="mr-1.5">📍</span>
                    <span>{activity.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {citations && citations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
            <span className="h-5 w-5 mr-2">🔗</span>
            Sources & More Info
          </h3>
          <ul className="space-y-2">
            {citations.map((citation, index) => {
              const source = citation.web || citation.maps;
              if (!source || !source.uri) return null;
              return (
                <li key={index}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 hover:underline truncate block text-sm"
                  >
                    {source.title || source.uri}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;
