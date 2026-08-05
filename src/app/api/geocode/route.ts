import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geo';

// GET /api/geocode?address=... -> lets the browser trigger a server-side geocode
// (via geocodeAddress in src/lib/geo.ts) without calling Nominatim directly from
// the client, keeping the required User-Agent/rate-limit handling on the server.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address?.trim()) {
    return NextResponse.json({ error: 'Falta la dirección' }, { status: 400 });
  }

  const coords = await geocodeAddress(address);
  if (!coords) {
    return NextResponse.json({ error: 'No se pudo ubicar esa dirección' }, { status: 404 });
  }

  return NextResponse.json(coords);
}
