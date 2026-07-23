import Link from 'next/link';
import StarRating from './StarRating';

interface BusinessCardProps {
  id: string;
  name: string;
  photoUrl?: string | null;
  specialties: string;
  location: string | null;
  distanceKm?: number | null;
  ratingAvg: number;
  ratingCount: number;
  professionalCount?: number;
  startingPrice?: number | null;
}

function formatDistance(km: number): string {
  if (km < 1) return `A ${Math.round(km * 1000)} m de ti`;
  return `A ${km.toFixed(1)} km de ti`;
}

export default function BusinessCard({
  id,
  name,
  photoUrl,
  specialties,
  location,
  distanceKm,
  ratingAvg,
  ratingCount,
  professionalCount,
  startingPrice,
}: BusinessCardProps) {
  const tags = specialties.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);

  return (
    <Link
      href={`/locales/${id}`}
      className="card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-36 bg-gradient-to-br from-moss-100 to-clay-100">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-clay-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-clay-500 animate-pulseSoft" />
          Reserva en vivo
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">{name}</h3>
          <StarRating rating={ratingAvg} count={ratingCount} />
        </div>

        {typeof distanceKm === 'number' ? (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-moss-50 px-2 py-0.5 text-xs font-medium text-moss-600">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21c-4.5-3-7.5-6.5-7.5-11A7.5 7.5 0 0112 2.5a7.5 7.5 0 017.5 7.5c0 4.5-3 8-7.5 11z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {formatDistance(distanceKm)}
          </p>
        ) : (
          location && <p className="text-xs text-ink/50">{location}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink/70">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-ink/60">
          {typeof startingPrice === 'number' ? (
            <span>
              Desde <span className="font-semibold text-ink">${startingPrice}</span>
            </span>
          ) : (
            <span />
          )}
          {typeof professionalCount === 'number' && professionalCount > 0 && (
            <span className="text-xs text-ink/40">
              {professionalCount} profesional{professionalCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
