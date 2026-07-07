'use client';

import { useEffect, useState } from 'react';
import { distanceKm } from '@/lib/geo';

function formatDistance(km: number): string {
  if (km < 1) return `A ${Math.round(km * 1000)} m de ti`;
  return `A ${km.toFixed(1)} km de ti`;
}

export default function DistanceBadge({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (!('geolocation' in navigator)) return;

    let cancelled = false;

    async function trySilentLocation() {
      try {
        // Only proceeds if the browser already granted location access elsewhere
        // (e.g. the professionals browse page) — never triggers a fresh prompt here.
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state !== 'granted' || cancelled) return;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            setDistance(
              distanceKm(
                { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
                { latitude, longitude }
              )
            );
          },
          () => {},
          { timeout: 8000 }
        );
      } catch {
        // Permissions API unsupported — stay silent rather than risk an unwanted prompt.
      }
    }

    trySilentLocation();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (distance == null) return null;

  return (
    <p className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-moss-50 px-2 py-0.5 text-xs font-medium text-moss-600">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21c-4.5-3-7.5-6.5-7.5-11A7.5 7.5 0 0112 2.5a7.5 7.5 0 017.5 7.5c0 4.5-3 8-7.5 11z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
      {formatDistance(distance)}
    </p>
  );
}
