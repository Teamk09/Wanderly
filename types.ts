export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface UserPreferences {
  location: string;
  preferences: string;
  dislikes: string;
  startDate: string;
  timeframe?: string;
  visitedPlaces?: string;
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

export interface SavedTrip {
  id: string;
  signature: string;
  title: string;
  location: string;
  startDate?: string;
  timeframe?: string;
  preferences: string;
  dislikes: string;
  summary?: string;
  savedAt: string;
  itinerary: Itinerary;
  citations?: GroundingChunk[];
}

export interface SuggestedIdea {
  id: string;
  title: string;
  description: string;
  location?: string;
  timeframe?: string;
  preferences?: string;
  dislikes?: string;
}

export interface UserProfile {
  likes: string;
  dislikes: string;
  visitedPlaces: string;
  updatedAt: string;
}
