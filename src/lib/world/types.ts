export type WorldQuest = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_image_url: string | null;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  city: string;
  reward_xp: number;
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  starts_at?: string | null;
  tags?: string[] | null;
};

export type MarkerState = "active" | "completed" | "locked" | "unknown";

export type WorldMarker = {
  quest: WorldQuest;
  lat: number;
  lng: number;
  state: MarkerState;
  distanceM: number | null;
};
