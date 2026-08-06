'use client';

import { useEffect, useState } from 'react';
import BusinessCard from '@/components/BusinessCard';
import Reveal from '@/components/motion/Reveal';
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

export default function NearbySection() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  if (loading || businesses.length === 0) return null;

  const withDistance = businesses.map((b) => ({
    ...b,
    distanceKm:
      userCoords && b.latitude != null && b.longitude != null
        ? distanceKm(userCoords, { latitude: b.latitude, longitude: b.longitude })
        : null,
  }));

  // Sin ubicación todavía caemos a mostrar los mejor calificados, para no dejar
  // la sección vacía mientras se resuelve (o si el usuario niega) el permiso.
  const sorted = userCoords
    ? [...withDistance].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : [...withDistance].sort((a, b) => b.ratingAvg - a.ratingAvg);

  const top3 = sorted.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="font-display text-3xl font-medium text-ink">Locales cercanos</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {top3.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.08}>
            <BusinessCard
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
          </Reveal>
        ))}
      </div>
    </section>
  );
}
