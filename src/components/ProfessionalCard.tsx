import Link from 'next/link';
import StarRating from './StarRating';
import Avatar from './Avatar';

interface ProfessionalCardProps {
  id: string;
  name: string;
  photoUrl?: string | null;
  specialties: string;
  location: string | null;
  distanceKm?: number | null;
  ratingAvg: number;
  ratingCount: number;
  startingPrice?: number;
}

function formatDistance(km: number): string {
  if (km < 1) return `A ${Math.round(km * 1000)} m de ti`;
  return `A ${km.toFixed(1)} km de ti`;
}

export default function ProfessionalCard({
  id,
  name,
  photoUrl,
  specialties,
  location,
  distanceKm,
  ratingAvg,
  ratingCount,
  startingPrice,
}: ProfessionalCardProps) {
  const tags = specialties.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);

  return (
    <Link
      href={`/professionals/${id}`}
      className="card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-16 bg-gradient-to-br from-moss-100 to-clay-100">
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-clay-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-clay-500 animate-pulseSoft" />
          Reserva en vivo
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between gap-2">
          <Avatar name={name} photoUrl={photoUrl} size="card" />
          <div className="pb-1">
            <StarRating rating={ratingAvg} count={ratingCount} />
          </div>
        </div>

        <h3 className="font-display text-lg font-semibold text-ink">{name}</h3>

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

        {typeof startingPrice === 'number' && (
          <p className="mt-auto pt-2 text-sm text-ink/60">
            Desde <span className="font-semibold text-ink">${startingPrice}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
