export interface Spot {
  id: string;
  name: string;
  description: string;
  time?: string;
  address?: string;
  imageUrl?: string;
}

export interface DaySchedule {
  day: number;
  date: string;
  spots: Spot[];
}

export interface Itinerary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryState {
  currentItinerary: Itinerary | null;
  isEditing: boolean;
}
