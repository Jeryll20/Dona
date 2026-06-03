import type { ActivityLocation } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PhotonProperties {
  osm_id:      number;
  name?:       string;
  street?:     string;
  housenumber?: string;
  postcode?:   string;
  city?:       string;
  country?:    string;
}

interface PhotonFeature {
  geometry:   { coordinates: [number, number] };
  properties: PhotonProperties;
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

function formatPhotonAddress(p: PhotonProperties): string {
  const parts: string[] = [];
  const street = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ');
  if (street) parts.push(street);
  const city = [p.postcode, p.city].filter(Boolean).join(' ');
  if (city) parts.push(city);
  if (p.country) parts.push(p.country);
  return parts.join(', ') || p.name || '';
}

// ── Address search — Photon (komoot, OSM-based, designed for autocomplete) ────

export async function searchAddresses(query: string): Promise<AddressResult[]> {
  if (query.length < 2) return [];
  try {
    const url =
      `https://photon.komoot.io/api/` +
      `?q=${encodeURIComponent(query)}` +
      `&limit=5&lang=fr`;
    const res = await fetch(url);
    const data: { features: PhotonFeature[] } = await res.json();
    return (data.features ?? []).map((f) => ({
      id:      String(f.properties.osm_id),
      address: formatPhotonAddress(f.properties),
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
