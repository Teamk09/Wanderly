export interface User {
  name: string;
  email: string;
}

export interface UserPreferences {
  location: string;
  preferences: string;
  dislikes: string;
  startDate: string;
  timeframe?: string;
}

export interface ItineraryLocation {
  name: string;
  description: string;
  time: string;
  address: string;
  timeSensitive?: boolean;
  timeSensitiveNote?: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
  calendarDate?: string;
  activities: ItineraryLocation[];
}

export interface Itinerary {
  title: string;
  days: ItineraryDay[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
  };
}
