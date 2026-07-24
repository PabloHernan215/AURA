'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import { distanceKm } from '@/lib/geo';

interface BusinessListItem {
  id: string;
  name: string;
  photoUrl: string | null;
  specialties: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  ratingCount: number;
  professionalCount: number;
  startingPrice: number | null;
}

// value = como se guarda en la base de datos (ya en español); label = lo que ve el usuario.
const SPECIALTY_FILTERS = [
  { label: 'Todos', value: 'All' },
  { label: 'Cabello', value: 'Cabello' },
  { label: 'Uñas', value: 'Uñas' },
  { label: 'Cejas y pestañas', value: 'Cejas y pestañas' },
  { label: 'Piel', value: 'Piel' },
  { label: 'Barba', value: 'Barba' },
  { label: 'Maquillaje', value: 'Maquillaje' },
  { label: 'Mens', value: 'Mens' },
];

type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported';

// Business rule: AURA only shows venues within this radius of the client.
const MAX_DISTANCE_KM = 3;

function BusinessesBrowser() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') ?? 'All';

  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState(initialSpecialty);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (specialty !== 'All') params.set('specialty', specialty);

    fetch(`/api/businesses?${params.toString()}`)
      .then((res) => res.json())
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, [query, specialty]);

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 }
    );
  }

  useEffect(() => {
    // Llegó desde la búsqueda del inicio ("Ver locales cercanos") — pide la
    // ubicación de una vez, sin que tenga que dar un clic adicional aquí.
    if (searchParams.get('autoLocate') === '1') {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adjunta la distancia (si tenemos ambas coordenadas) y ordena por cercanía cuando aplica.
  const withDistance = businesses.map((b) => ({
    ...b,
    distanceKm:
      userCoords && b.latitude != null && b.longitude != null
        ? distanceKm(userCoords, { latitude: b.latitude, longitude: b.longitude })
        : null,
  }));

  // Regla de negocio: solo mostramos locales dentro de un radio de 3 km del
  // cliente. Si no conocemos la distancia (su dirección aún no se geocodificó),
  // lo ocultamos también — no podemos confirmar que cumple la regla.
  const visible = userCoords
    ? withDistance.filter((b) => b.distanceKm != null && b.distanceKm <= MAX_DISTANCE_KM)
    : withDistance;

  const sorted = userCoords
    ? [...visible].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    : visible;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-stone">Directorio</span>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">Encuentra tu local</h1>
      <p className="mt-1 text-sm text-ink/60">Disponibilidad en tiempo real, sin esperar una llamada.</p>

      {locationStatus === 'idle' && (
        <button
          onClick={requestLocation}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-moss-50 px-4 py-2 text-sm font-medium text-moss-600 hover:bg-moss-100"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 21c-4.5-3-7.5-6.5-7.5-11A7.5 7.5 0 0112 2.5a7.5 7.5 0 017.5 7.5c0 4.5-3 8-7.5 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Ver qué tan cerca están de ti
        </button>
      )}
      {locationStatus === 'loading' && <p className="mt-5 text-sm text-ink/50">Buscando tu ubicación…</p>}
      {locationStatus === 'denied' && (
        <p className="mt-5 text-sm text-stone">
          No pudimos acceder a tu ubicación — puedes activarla desde los permisos del navegador para ver distancias.
        </p>
      )}
      {locationStatus === 'granted' && (
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-moss-600">
          <span className="h-1.5 w-1.5 rounded-full bg-moss-500" />
          Mostrando locales a menos de {MAX_DISTANCE_KM} km de ti
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input sm:max-w-xs"
          placeholder="Buscar por nombre o especialidad…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpecialty(s.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                specialty === s.value ? 'bg-ink text-white' : 'bg-sand text-ink/70 hover:bg-ink/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando locales…</p>
        ) : sorted.length === 0 ? (
          <p className="rounded-xl bg-sand px-4 py-6 text-center text-sm text-ink/60">
            {userCoords
              ? `No encontramos locales a menos de ${MAX_DISTANCE_KM} km de tu ubicación por ahora.`
              : 'Ningún local coincide con tu búsqueda todavía.'}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((b) => (
              <BusinessCard
                key={b.id}
                id={b.id}
                name={b.name}
                photoUrl={b.photoUrl}
                specialties={b.specialties}
                location={b.location}
                distanceKm={b.distanceKm}
                ratingAvg={b.ratingAvg}
                ratingCount={b.ratingCount}
                professionalCount={b.professionalCount}
                startingPrice={b.startingPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocalesPage() {
  return (
    <Suspense fallback={null}>
      <BusinessesBrowser />
    </Suspense>
  );
}
