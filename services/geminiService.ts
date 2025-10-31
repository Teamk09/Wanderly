import { GoogleGenAI } from "@google/genai";
import { Itinerary, UserPreferences, GroundingChunk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createPrompt = (preferences: UserPreferences): string => {
  return `
    Create a detailed travel itinerary for a ${preferences.duration}-day trip to ${preferences.location}.

    The user has the following preferences:
    - Likes: ${preferences.preferences}
    - Dislikes/Blacklist (avoid these): ${preferences.dislikes}

    Your task is to generate a complete, day-by-day itinerary.
    - Be creative and suggest a mix of popular spots and hidden gems.
    - Use the search tool to find interesting, relevant, and possibly time-sensitive events or locations.
    - Ensure the itinerary flows logically from one location to the next.
    - Provide a specific address for each location to be used with a mapping service.
    
    The final output MUST be a single, valid JSON object and nothing else. Do not add any text before or after the JSON object. Do not wrap it in markdown backticks.
    The JSON object must strictly adhere to the following structure:
    {
      "title": "string (A creative and catchy title for the itinerary. e.g., 'A Culinary and Cultural Journey Through Tokyo')",
      "days": [
        {
          "day": "integer (The day number, starting from 1)",
          "theme": "string (A theme for the day's activities. e.g., 'Historic Landmarks & Modern Art')",
          "activities": [
            {
              "name": "string (The name of the place or activity)",
              "description": "string (A brief, engaging description of the activity (2-3 sentences))",
              "time": "string (The suggested time for the activity (e.g., '9:00 AM - 11:00 AM'))",
              "address": "string (The physical address of the location for mapping purposes)"
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
