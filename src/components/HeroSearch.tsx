'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TREATMENT_OPTIONS = [
  { label: 'Todos los tratamientos', value: 'All' },
  { label: 'Cabello', value: 'Cabello' },
  { label: 'Uñas', value: 'Uñas' },
  { label: 'Cejas y pestañas', value: 'Cejas y pestañas' },
  { label: 'Piel', value: 'Piel' },
  { label: 'Barba', value: 'Barba' },
  { label: 'Maquillaje', value: 'Maquillaje' },
  { label: 'Mens', value: 'Mens' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [treatment, setTreatment] = useState('All');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (treatment !== 'All') params.set('specialty', treatment);
    // Le pide la ubicación automáticamente al llegar a /locales, para mostrar
    // de una vez los locales más cercanos sin un clic adicional.
    params.set('autoLocate', '1');
    router.push(`/locales?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="card p-7">
      <p className="label">¿Qué te quieres hacer?</p>
      <div className="mt-4">
        <select
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          className="input"
        >
          {TREATMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary mt-4 w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
          <path d="M12 21c-4.5-3-7.5-6.5-7.5-11A7.5 7.5 0 0112 2.5a7.5 7.5 0 017.5 7.5c0 4.5-3 8-7.5 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        Ver locales cercanos
      </button>

      <p className="mt-4 text-center text-xs text-stone">Así de simple es reservar en AURA</p>
    </form>
  );
}
