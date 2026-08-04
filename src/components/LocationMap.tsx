interface LocationMapProps {
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

// No hay API key de Google Maps configurada en el proyecto, así que usamos el
// embed público de Google Maps (sin key) centrado en coordenadas o, si aún no
// se geocodificó la dirección, en el texto de `location` como respaldo.
export default function LocationMap({ location, latitude, longitude }: LocationMapProps) {
  const query =
    latitude != null && longitude != null ? `${latitude},${longitude}` : location?.trim() || null;

  if (!query) return null;

  const encoded = encodeURIComponent(query);
  const embedSrc = `https://www.google.com/maps?q=${encoded}&z=15&output=embed`;
  const openHref = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-ink/10">
      <iframe
        title="Ubicación en el mapa"
        src={embedSrc}
        width="100%"
        height="220"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={openHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-moss-600 hover:bg-sand/60"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21c-4.5-3-7.5-6.5-7.5-11A7.5 7.5 0 0112 2.5a7.5 7.5 0 017.5 7.5c0 4.5-3 8-7.5 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        Abrir en Google Maps
      </a>
    </div>
  );
}
