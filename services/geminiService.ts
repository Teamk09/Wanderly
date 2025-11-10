import { Itinerary, UserPreferences, GroundingChunk } from "../types";
interface GeminiContentPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiContentPart[];
}

interface GeminiGroundingChunk {
  web?: { uri?: string; title?: string };
  maps?: { uri?: string; title?: string };
  [key: string]: unknown;
}

interface GeminiCandidate {
  content?: GeminiContent;
  groundingMetadata?: {
    groundingChunks?: GeminiGroundingChunk[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const GEMINI_PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL as
  | string
  | undefined;

const createPrompt = (preferences: UserPreferences): string => {
  const {
    startDate,
    location,
    preferences: likes,
    dislikes,
    timeframe,
  } = preferences;

  const start = new Date(startDate);
  const hasValidStartDate = !Number.isNaN(start.getTime());
  const canonicalDate = hasValidStartDate
    ? start.toISOString().split("T")[0]
    : startDate;

  const trimmedTimeframe = timeframe?.trim();
  const timeframeLabel = trimmedTimeframe ? trimmedTimeframe : "All day";
  const normalizedTimeframe = timeframeLabel.toLowerCase();
  const scheduleInstruction =
    normalizedTimeframe === "all day"
      ? "Build a balanced plan that spans morning through evening with realistic transitions between activities."
      : `Ensure the entire schedule fits within this window: ${timeframeLabel}. Choose opening times and transitions that respect that timeframe.`;

  const datePhrase = canonicalDate || "the specified date";

  return `
    Create a detailed single-day travel itinerary for ${location} on ${datePhrase}.

    Traveler preferences:
    - Likes: ${likes}
    - Dislikes/Blacklist (avoid these): ${dislikes}
    - Desired timeframe: ${timeframeLabel}

    Your task is to generate a complete daytrip itinerary.
    - Be creative and suggest a mix of popular spots and hidden gems.
    - Use the search tool to find interesting, relevant, and time-sensitive events or locations that occur on the single day that the user has specified.
    - Make sure each day's plan corresponds to the actual calendar date
    - For every day, explicitly search the web for events occurring on that calendar date (examples: "${preferences.location} events ${startDate}", "${preferences.location} festival", "${preferences.location} flea market ${startDate}", venue-specific calendars). Prioritize reputable local event sources such as tourism boards, venue listings, or city blogs. Only include an event if the search confirms it happens on that specific date.
    - Include seasonal or date-specific activities (festivals, exhibits, events) when available for those dates, and clearly mark them as time-sensitive.
    - When you add a time-sensitive activity, extract a short confirmation note citing the event's date/time (e.g., "Confirmed via Tokyo Cheapo events calendar for ${startDate}").
    - Ensure the itinerary flows logically from one location to the next.
    - ${scheduleInstruction}
    - Include a "calendarDate" property on each day (ISO format YYYY-MM-DD) that matches the real-world date for that day of the trip.
    - Provide a specific address for each location to be used with a mapping service.

    The trip calendar for reference:
    
    The final output MUST be a single, valid JSON object and nothing else. Do not add any text before or after the JSON object. Do not wrap it in markdown backticks.
    The JSON object must strictly adhere to the following structure:
    {
      "title": "string (A creative and catchy title for the itinerary. e.g., 'A Culinary and Cultural Journey Through Tokyo')",
      "days": [
        {
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
  if (!GEMINI_PROXY_URL) {
    throw new Error("Gemini proxy URL is not configured.");
  }

  let rawText = "";
  try {
    const prompt = createPrompt(preferences);
    const response = await fetch(GEMINI_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini proxy error:", errorBody);
      throw new Error("Gemini service returned an error.");
    }

    const data: GeminiResponse = await response.json();
    rawText = extractModelText(data).trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : rawText;

    const itinerary: Itinerary = JSON.parse(jsonText);

    const citations = (data.candidates?.[0]?.groundingMetadata
      ?.groundingChunks ?? []) as GeminiGroundingChunk[];

    const validCitations: GroundingChunk[] = citations
      .filter(
        (chunk) =>
          (chunk.web && chunk.web.uri) || (chunk.maps && chunk.maps.uri)
      )
      .map((chunk) => ({
        web: chunk.web,
        maps: chunk.maps,
      }));

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

function extractModelText(data: GeminiResponse): string {
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    return "";
  }

  return candidate.content.parts
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}
