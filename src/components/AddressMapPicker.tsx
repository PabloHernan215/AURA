'use client';

// Only ever loaded client-side (see register/page.tsx, which imports this via
// next/dynamic with ssr: false) — safe to import Leaflet statically here since
// this module never gets evaluated during server rendering.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default marker icon resolves image paths relative to the page URL,
// which breaks under bundlers — this is the standard fix: point it at the
// bundled asset URLs instead.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressMapPickerProps {
  address: string;
  onChange: (coords: Coordinates | null) => void;
}

export default function AddressMapPicker({ address, onChange }: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!address.trim()) {
      setError('Escribe primero la dirección arriba');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo ubicar esa dirección');
        return;
      }
      setCoords({ latitude: data.latitude, longitude: data.longitude });
    } catch {
      setError('No se pudo ubicar esa dirección. Intenta de nuevo.');
    } finally {
      setSearching(false);
    }
  }

  // Creates the map only once the container is actually visible (coords truthy —
  // see the `hidden` class below), since Leaflet can't size itself on a
  // display:none element. Subsequent coordinate changes just move the view/marker.
  useEffect(() => {
    if (!coords) return;

    if (!mapRef.current) {
      if (!containerRef.current) return;
      const map = L.map(containerRef.current).setView([coords.latitude, coords.longitude], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([coords.latitude, coords.longitude], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({ latitude: pos.lat, longitude: pos.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      mapRef.current.setView([coords.latitude, coords.longitude], 16);
      markerRef.current?.setLatLng([coords.latitude, coords.longitude]);
    }

    onChangeRef.current(coords);
  }, [coords]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={handleSearch}
        disabled={searching}
        className="btn-secondary py-2 text-sm"
      >
        {searching ? 'Buscando…' : coords ? 'Buscar de nuevo' : 'Ver en el mapa'}
      </button>
      {error && <p className="mt-1 text-xs text-moss-600">{error}</p>}

      {coords && (
        <p className="mt-2 text-xs text-ink/40">
          Arrastra el marcador para ajustar la ubicación exacta de tu local.
        </p>
      )}

      <div
        ref={containerRef}
        className={coords ? 'mt-2 h-64 w-full overflow-hidden rounded-xl border border-ink/10' : 'hidden'}
      />
    </div>
  );
}
