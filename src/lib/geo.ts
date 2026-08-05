// Turns a plain address string (e.g. "AURA Hub - Centro, CDMX") into coordinates,
// using LocationIQ's geocoding API (same request/response shape as OpenStreetMap's
// Nominatim, which LocationIQ proxies — the free plan just needs a key, no card).
//
// We switched away from calling Nominatim directly because its public instance
// blocks/rate-limits shared cloud IPs (Vercel serverless included), which made
// geocoding silently fail in production. Requires LOCATIONIQ_API_KEY — see
// .env.example. Without it, this logs a warning and returns null, same as
// before: geocoding is always best-effort and never blocks registration/saves.

interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    console.warn('[Geocode] LOCATIONIQ_API_KEY no configurada — no se geocodificó la dirección.');
    return null;
  }

  try {
    const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const { lat, lon } = results[0];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (isNaN(latitude) || isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch (err) {
    console.warn('[Geocode] No se pudo geocodificar la dirección:', err);
    return null;
  }
}

/**
 * Straight-line (haversine) distance between two coordinates, in kilometers.
 */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}
