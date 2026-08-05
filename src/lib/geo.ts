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
 * Turns coordinates back into a human-readable address (LocationIQ reverse
 * geocoding) — used when a business owner picks their location via GPS or a
 * dragged pin, so the address text field can be filled in automatically.
 * Best-effort: returns null on any failure, same as geocodeAddress.
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${coords.latitude}&lon=${coords.longitude}&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const result = await response.json();
    return typeof result?.display_name === 'string' ? result.display_name : null;
  } catch (err) {
    console.warn('[Geocode] No se pudo obtener la dirección desde las coordenadas:', err);
    return null;
  }
}

// Pulls lat/lng out of a Google Maps URL when it's embedded directly in it —
// covers the common formats you get from the address bar or the "Share" menu:
//   .../@19.4326,-99.1332,15z            (viewport center)
//   ...?q=19.4326,-99.1332                (plain query)
//   ...?ll=19.4326,-99.1332
//   .../data=!3d19.4326!4d-99.1332        (embedded place coordinates)
function parseGoogleMapsUrl(url: string): Coordinates | null {
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (!match) continue;
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    if (!isNaN(latitude) && !isNaN(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return { latitude, longitude };
    }
  }
  return null;
}

/**
 * Resolves a Google Maps link (full URL or a shortened maps.app.goo.gl / goo.gl
 * one) to coordinates. Short links don't carry the coordinates in the URL
 * itself, so we follow the redirect server-side first and parse the real
 * destination URL — this can't be done from the browser (CORS).
 */
export async function resolveGoogleMapsLink(rawUrl: string): Promise<Coordinates | null> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const direct = parseGoogleMapsUrl(trimmed);
  if (direct) return direct;

  try {
    const response = await fetch(trimmed, { redirect: 'follow' });
    return parseGoogleMapsUrl(response.url);
  } catch (err) {
    console.warn('[Geocode] No se pudo resolver el enlace de Google Maps:', err);
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
