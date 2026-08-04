'use client';

import Link from 'next/link';

interface ServiceDetailModalProps {
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl?: string | null;
  bookHref: string;
  onClose: () => void;
}

export default function ServiceDetailModal({
  name,
  description,
  price,
  duration,
  photoUrl,
  bookHref,
  onClose,
}: ServiceDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-moss-100 to-clay-100">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-5xl text-moss-500/60">✂</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg text-ink shadow-sm hover:bg-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-semibold text-ink">{name}</h3>
            <span className="shrink-0 font-display text-xl font-semibold text-ink">${price}</span>
          </div>
          <p className="mt-1 font-mono text-sm text-ink/50">{duration} min</p>
          {description && <p className="mt-4 text-sm leading-relaxed text-ink/70">{description}</p>}

          <Link href={bookHref} className="btn-primary mt-6 flex w-full items-center justify-center">
            Reservar
          </Link>
        </div>
      </div>
    </div>
  );
}
