'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">Algo salió mal</h1>
      <p className="mt-2 text-sm text-ink/60">
        No pudimos cargar esta página. Puedes intentar de nuevo.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Reintentar
      </button>
    </div>
  );
}
