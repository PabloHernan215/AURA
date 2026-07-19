'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ProfessionalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-xl font-semibold text-ink">No pudimos cargar este perfil</h1>
      <p className="mt-2 text-sm text-ink/60">Intenta de nuevo o vuelve al directorio de profesionales.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-secondary py-2 text-sm">
          Reintentar
        </button>
        <Link href="/professionals" className="btn-primary py-2 text-sm">
          Ver profesionales
        </Link>
      </div>
    </div>
  );
}
