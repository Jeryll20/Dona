import type { ActivityLocation } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface AddressResult {
  id:      string;
  address: string;
  lat:     number;
  lng:     number;
}

export interface DistanceResult {
  durationMinutes: number;
  distanceKm:      number;
}

// ── Address search — Nominatim (OpenStreetMap) ────────────────────────────────

export async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (query.length < 3) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=5&accept-language=fr`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DonaApp/1.0 contact@dona.app' },
    });
    const data: NominatimResult[] = await res.json();
    return data.map((r) => ({
      id:      String(r.place_id),
      address: r.display_name,
      lat:     parseFloat(r.lat),
      lng:     parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

// ── Travel time — OSRM (open-source routing) ──────────────────────────────────
// Note: OSRM expects lng,lat order (not lat,lng)

export async function getTravelTime(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<DistanceResult | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    return {
      durationMinutes: Math.ceil((route.duration as number) / 60),
      distanceKm:      Math.round((route.distance as number) / 100) / 10,
    };
  } catch {
    return null;
  }
}

// Re-export ActivityLocation for convenience
export type { ActivityLocation };
