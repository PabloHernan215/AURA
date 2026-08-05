import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geo';

// GET /api/geocode/reverse?lat=..&lng=.. -> human-readable address for a pair of
// coordinates, used to fill the address field after picking a location via GPS.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
  }

  const address = await reverseGeocode({ latitude: lat, longitude: lng });
  if (!address) {
    return NextResponse.json({ error: 'No se pudo obtener la dirección' }, { status: 404 });
  }

  return NextResponse.json({ address });
}
