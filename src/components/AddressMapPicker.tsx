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
  /** Called when a location is picked via GPS/enlace and we could resolve a
   * human-readable address for it, so the address field can autofill. */
  onAddressResolved?: (address: string) => void;
}

export default function AddressMapPicker({ address, onChange, onAddressResolved }: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddressResolvedRef = useRef(onAddressResolved);
  onAddressResolvedRef.current = onAddressResolved;

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [busy, setBusy] = useState<'address' | 'gps' | 'link' | null>(null);
  const [error, setError] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mapsLink, setMapsLink] = useState('');

  async function handleSearch() {
    if (!address.trim()) {
      setError('Escribe primero la dirección arriba');
      return;
    }
    setBusy('address');
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
      setBusy(null);
    }
  }

  function handleUseCurrentLocation() {
    if (!('geolocation' in navigator)) {
      setError('Tu navegador no soporta obtener tu ubicación actual.');
      return;
    }
    setBusy('gps');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(here);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${here.latitude}&lng=${here.longitude}`);
          const data = await res.json();
          if (res.ok && data?.address) onAddressResolvedRef.current?.(data.address);
        } catch {
          // Non-fatal — the pin is already set, the owner can type the address by hand.
        } finally {
          setBusy(null);
        }
      },
      () => {
        setError('No pudimos acceder a tu ubicación — revisa los permisos del navegador.');
        setBusy(null);
      },
      { timeout: 8000 }
    );
  }

  async function handleUseMapsLink() {
    if (!mapsLink.trim()) {
      setError('Pega primero el enlace de Google Maps');
      return;
    }
    setBusy('link');
    setError('');
    try {
      const res = await fetch(`/api/geocode?mapsUrl=${encodeURIComponent(mapsLink.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'No pudimos leer la ubicación de ese enlace');
        return;
      }
      const here = { latitude: data.latitude, longitude: data.longitude };
      setCoords(here);
      const reverseRes = await fetch(`/api/geocode/reverse?lat=${here.latitude}&lng=${here.longitude}`);
      const reverseData = await reverseRes.json();
      if (reverseRes.ok && reverseData?.address) onAddressResolvedRef.current?.(reverseData.address);
    } catch {
      setError('No pudimos leer la ubicación de ese enlace. Intenta de nuevo.');
    } finally {
      setBusy(null);
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={busy !== null}
          className="btn-secondary py-2 text-sm"
        >
          {busy === 'gps' ? 'Obteniendo tu ubicación…' : '📍 Usar mi ubicación actual'}
        </button>
        <button
          type="button"
          onClick={handleSearch}
          disabled={busy !== null}
          className="btn-secondary py-2 text-sm"
        >
          {busy === 'address' ? 'Buscando…' : coords ? 'Buscar de nuevo' : 'Ver en el mapa'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowLinkInput((v) => !v)}
        className="mt-2 text-xs font-medium text-moss-600 hover:underline"
      >
        {showLinkInput ? 'Ocultar' : '¿Prefieres pegar un enlace de Google Maps?'}
      </button>

      {showLinkInput && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            placeholder="https://maps.google.com/... o https://maps.app.goo.gl/..."
          />
          <button
            type="button"
            onClick={handleUseMapsLink}
            disabled={busy !== null}
            className="btn-secondary shrink-0 py-2 text-sm"
          >
            {busy === 'link' ? 'Leyendo…' : 'Usar enlace'}
          </button>
        </div>
      )}

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
