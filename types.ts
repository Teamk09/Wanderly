export interface User {
  name: string;
  email: string;
}

export interface UserPreferences {
  location: string;
  preferences: string;
  dislikes: string;
  duration: number;
}

export interface ItineraryLocation {
  name: string;
  description: string;
  time: string;
  address: string;
}

export interface ItineraryDay {
  day: number;
  theme: string;
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
