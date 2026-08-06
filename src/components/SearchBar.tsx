'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TREATMENT_OPTIONS = [
  { label: 'Tipo de servicio', value: 'All' },
  { label: 'Cabello', value: 'Cabello' },
  { label: 'Uñas', value: 'Uñas' },
  { label: 'Cejas y pestañas', value: 'Cejas y pestañas' },
  { label: 'Piel', value: 'Piel' },
  { label: 'Barba', value: 'Barba' },
  { label: 'Maquillaje', value: 'Maquillaje' },
  { label: 'Mens', value: 'Mens' },
];

export default function SearchBar() {
  const router = useRouter();
  const [treatment, setTreatment] = useState('All');
  const [location, setLocation] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (treatment !== 'All') params.set('specialty', treatment);
    if (location.trim()) params.set('q', location.trim());
    router.push(`/locales?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm sm:flex-row sm:items-center sm:rounded-full"
    >
      <div className="flex-1 border-b border-ink/8 px-5 py-2.5 sm:border-b-0 sm:border-r sm:border-ink/10">
        <label className="block text-left text-[10px] font-semibold uppercase tracking-wide text-stone">
          Tipo de servicio
        </label>
        <select
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          className="w-full bg-transparent text-sm text-ink focus:outline-none"
        >
          {TREATMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 px-5 py-2.5">
        <label className="block text-left text-[10px] font-semibold uppercase tracking-wide text-stone">
          Ubicación
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Tu dirección o zona"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/30 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="m-2 shrink-0 rounded-full bg-ink px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/90"
      >
        Buscar
      </button>
    </form>
  );
}
