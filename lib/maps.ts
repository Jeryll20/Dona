import type { ActivityLocation } from '@/types';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface DistanceResult {
  durationMinutes: number;
  distanceKm: number;
}

// ── Places Autocomplete ───────────────────────────────────────────────────────

export async function searchPlaces(input: string): Promise<PlacePrediction[]> {
  if (!MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' || input.length < 2) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(input)}` +
      `&language=fr` +
      `&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.predictions ?? []) as PlacePrediction[];
  } catch {
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<ActivityLocation | null> {
  if (!MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=formatted_address,geometry` +
      `&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data.result;
    if (!result?.geometry?.location) return null;
    return {
      address: result.formatted_address as string,
      lat:     result.geometry.location.lat as number,
      lng:     result.geometry.location.lng as number,
    };
  } catch {
    return null;
  }
}

// ── Distance Matrix ───────────────────────────────────────────────────────────

export async function getTravelTime(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' | 'transit' | 'walking' = 'driving',
): Promise<DistanceResult | null> {
  if (!MAPS_KEY || MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin.lat},${origin.lng}` +
      `&destinations=${destination.lat},${destination.lng}` +
      `&mode=${mode}` +
      `&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const el = data?.rows?.[0]?.elements?.[0];
    if (el?.status !== 'OK') return null;
    return {
      durationMinutes: Math.ceil((el.duration.value as number) / 60),
      distanceKm:      Math.round((el.distance.value as number) / 100) / 10,
    };
  } catch {
    return null;
  }
}
