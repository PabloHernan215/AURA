'use client';

import { useState } from 'react';

export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-xl bg-sand transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt={`${name} — foto ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[openIndex]}
            alt={`${name} — foto ${openIndex + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
