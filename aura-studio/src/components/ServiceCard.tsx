'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ServiceCardProps {
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl?: string | null;
  selected?: boolean;
  onSelect?: () => void;
  /** If provided, an action button/link is shown inside the overlay once revealed */
  actionLabel?: string;
  actionHref?: string;
}

export default function ServiceCard({
  name,
  description,
  price,
  duration,
  photoUrl,
  selected,
  onSelect,
  actionLabel,
  actionHref,
}: ServiceCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={`group relative aspect-square w-full overflow-hidden rounded-2xl border transition-colors ${
        selected ? 'border-moss-500' : 'border-ink/10'
      }`}
    >
      {/* Tap/click toggles the overlay (mobile); desktop also gets it on hover via group-hover */}
      <button
        type="button"
        onClick={() => {
          setRevealed((v) => !v);
          onSelect?.();
        }}
        className="absolute inset-0 h-full w-full text-left"
        aria-expanded={revealed}
        aria-label={`Ver detalles de ${name}`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-moss-100 to-clay-100">
            <span className="font-display text-3xl text-moss-500/60">✂</span>
          </div>
        )}

        {/* Price chip stays visible at all times as a subtle visual anchor */}
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 font-display text-xs font-semibold text-ink shadow-sm">
          ${price}
        </span>

        {/* Info overlay: hidden by default, revealed on hover (desktop) or click/tap (any device) */}
        <div
          className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 transition-opacity duration-200 ${
            revealed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <h4 className="font-display text-sm font-semibold leading-tight text-white sm:text-base">{name}</h4>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/80 sm:text-sm">{description}</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-white/70">{duration} min</p>
        </div>
      </button>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          onClick={(e) => e.stopPropagation()}
          className={`btn-primary absolute bottom-3 right-3 z-10 py-1.5 text-xs transition-opacity duration-200 ${
            revealed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
