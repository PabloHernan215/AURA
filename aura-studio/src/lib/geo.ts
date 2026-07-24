// Turns a plain address string (e.g. "AURA Hub - Centro, CDMX") into coordinates,
// using OpenStreetMap's free Nominatim API — no signup or API key required.
//
// Usage policy note: Nominatim asks for a maximum of ~1 request/second and a
// descriptive User-Agent, which is exactly how this is called (only on the rare
// occasion a professional saves/changes their location text).

interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent identifying the app.
        'User-Agent': 'AURA-Studio-Booking-App/1.0 (contact: admin@example.com)',
      },
    });

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
