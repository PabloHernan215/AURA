import { NextResponse } from 'next/server';
import { geocodeAddress, resolveGoogleMapsLink } from '@/lib/geo';

// GET /api/geocode?address=...   -> geocodes a typed address (LocationIQ)
// GET /api/geocode?mapsUrl=...   -> resolves a pasted Google Maps link to coordinates
// Both run server-side so the client never needs the LocationIQ key or has to
// deal with CORS when following a shortened maps.app.goo.gl redirect.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const mapsUrl = searchParams.get('mapsUrl');

  if (mapsUrl?.trim()) {
    const coords = await resolveGoogleMapsLink(mapsUrl);
    if (!coords) {
      return NextResponse.json({ error: 'No pudimos leer la ubicación de ese enlace' }, { status: 404 });
    }
    return NextResponse.json(coords);
  }

  if (!address?.trim()) {
    return NextResponse.json({ error: 'Falta la dirección o el enlace' }, { status: 400 });
  }

  const coords = await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json({ error: 'No se pudo ubicar esa dirección' }, { status: 404 });
  }

  return NextResponse.json(coords);
}
