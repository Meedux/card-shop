/** A store record returned from the API (with extracted lat/lng from PostGIS geography) */
export interface StoreWithLocation {
  id: string;
  name: string | null;
  address: string | null;
  business_hours: string | null;
  tags: string[];
  languages: string[];
  area: string | null;
  lat: number;
  lng: number;
  distance_m: number | null; // distance in meters (null when no reference point)
  avg_rating: number | null;
  review_count: number;
}

/** Query params accepted by GET /api/stores */
export interface StoreSearchParams {
  lat?: number;
  lng?: number;
  radius?: number; // meters, default 5000
  area?: string;
  limit?: number; // default 50
}

/** Coordinates for the center of the map */
export interface LatLng {
  lat: number;
  lng: number;
}
