import type { ActivityLocation } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BanFeature {
  geometry:   { coordinates: [number, number] };
  properties: { label: string; score: number };
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

// ── Address search — Base Adresse Nationale (gouvernement français) ───────────
// Couverture exhaustive France, gratuit, sans clé API

export async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (query.length < 2) return [];
  try {
    const url =
      `https://api-adresse.data.gouv.fr/search/` +
      `?q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url);
    const data: { features: BanFeature[] } = await res.json();
    return (data.features ?? []).map((f, i) => ({
      id:      String(i),
      address: f.properties.label,
      lat:     f.geometry.coordinates[1],
      lng:     f.geometry.coordinates[0],
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
