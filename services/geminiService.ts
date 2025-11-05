import { GoogleGenAI } from "@google/genai";
import { Itinerary, UserPreferences, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createPrompt = (preferences: UserPreferences): string => {
  const startDate = preferences.startDate;
  const endDate = (() => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return startDate;
    }
    const inclusiveEnd = new Date(start);
    inclusiveEnd.setDate(inclusiveEnd.getDate() + preferences.duration - 1);
    return inclusiveEnd.toISOString().split("T")[0];
  })();

  const dayDateLines = (() => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return "";
    }
    return Array.from({ length: preferences.duration }, (_, index) => {
      const current = new Date(start);
      current.setDate(current.getDate() + index);
      return `- Day ${index + 1}: ${current.toISOString().split("T")[0]}`;
    }).join("\n    ");
  })();

  return `
    Create a detailed travel itinerary for a ${
      preferences.duration
    }-day trip to ${preferences.location}.

    The user has the following preferences:
    - Likes: ${preferences.preferences}
    - Dislikes/Blacklist (avoid these): ${preferences.dislikes}
    - Trip starts on (local arrival date): ${startDate}

    Your task is to generate a complete, day-by-day itinerary.
    - Be creative and suggest a mix of popular spots and hidden gems.
    - Use the search tool to find interesting, relevant, and time-sensitive events or locations that occur between ${startDate} and ${endDate}.
    - Make sure each day's plan corresponds to the actual calendar date, starting with Day 1 on ${startDate} and continuing chronologically.
    - For every day, explicitly search the web for events occurring on that calendar date (examples: "${
      preferences.location
    } events ${startDate}", "${preferences.location} festival", "${
    preferences.location
  } flea market ${startDate}", venue-specific calendars). Prioritize reputable local event sources such as tourism boards, venue listings, or city blogs. Only include an event if the search confirms it happens on that specific date.
    - Include seasonal or date-specific activities (festivals, exhibits, events) when available for those dates, and clearly mark them as time-sensitive.
    - When you add a time-sensitive activity, extract a short confirmation note citing the event's date/time (e.g., "Confirmed via Tokyo Cheapo events calendar for ${startDate}").
    - Ensure the itinerary flows logically from one location to the next.
    - Include a "calendarDate" property on each day (ISO format YYYY-MM-DD) that matches the real-world date for that day of the trip.
    - Provide a specific address for each location to be used with a mapping service.

    The trip calendar for reference:
    ${
      dayDateLines ||
      "(Unable to compute day-by-day dates; fall back to the provided start date.)"
    }
    
    The final output MUST be a single, valid JSON object and nothing else. Do not add any text before or after the JSON object. Do not wrap it in markdown backticks.
    The JSON object must strictly adhere to the following structure:
    {
      "title": "string (A creative and catchy title for the itinerary. e.g., 'A Culinary and Cultural Journey Through Tokyo')",
      "days": [
        {
          "day": "integer (The day number, starting from 1)",
          "calendarDate": "string (The ISO date for this day of the trip, e.g., '2025-03-18')",
          "theme": "string (A theme for the day's activities. e.g., 'Historic Landmarks & Modern Art')",
          "activities": [
            {
              "name": "string (The name of the place or activity)",
              "description": "string (A brief, engaging description of the activity (2-3 sentences))",
              "time": "string (The suggested time for the activity (e.g., '9:00 AM - 11:00 AM'))",
              "address": "string (The physical address of the location for mapping purposes)",
              "timeSensitive": "boolean (true if this activity only occurs on the specified calendarDate, false otherwise)",
              "timeSensitiveNote": "string (If timeSensitive is true, provide the supporting detail and source used to confirm the date)"
            }
          ]
        }
      ]
    }
  `;
};

export const generateItinerary = async (
  preferences: UserPreferences
): Promise<{ itinerary: Itinerary; citations: GroundingChunk[] }> => {
  let rawText = "";
  try {
    const prompt = createPrompt(preferences);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    rawText = response.text.trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : rawText;

    const itinerary: Itinerary = JSON.parse(jsonText);

    const citations =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const validCitations = citations.filter(
      (c) => (c.web && c.web.uri) || (c.maps && c.maps.uri)
    );

    return { itinerary, citations: validCitations };
  } catch (error) {
    console.error("Error generating itinerary:", error);
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON response from AI. Raw text:", rawText);
      throw new Error("The AI returned an invalid format. Please try again.");
    }
    throw new Error("Could not connect to the itinerary generation service.");
  }
};
