'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProfessionalAvailabilityPage() {
  const { status } = useSession();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch('/api/professionals/me')
      .then((res) => res.json())
      .then((data) => setWindows(data.availability ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  async function handleAdd() {
    setError('');
    if (startTime >= endTime) {
      setError('La hora de inicio debe ser antes de la hora de fin');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek, startTime, endTime }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? 'Algo salió mal');
      return;
    }
    load();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/availability?id=${id}`, { method: 'DELETE' });
    load();
  }

  const grouped = DAYS.map((_, dayIndex) => windows.filter((w) => w.dayOfWeek === dayIndex));

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/dashboard/professional" className="text-sm text-ink/50 hover:text-ink">
        ← Panel
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Horario semanal</h1>
      <p className="mt-1 text-sm text-ink/60">
        Agrega bloques recurrentes cuando estés disponible. Los clientes solo verán horarios dentro de estos rangos.
      </p>

      <div className="card mt-6 space-y-3 p-5">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Día</label>
            <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Inicio</label>
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label">Fin</label>
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-moss-600">{error}</p>}
        <button onClick={handleAdd} disabled={saving} className="btn-primary w-full">
          {saving ? 'Agregando…' : 'Agregar bloque'}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando…</p>
        ) : (
          grouped.map((dayWindows, dayIndex) => (
            <div key={dayIndex}>
              <p className="text-sm font-semibold text-ink">{DAYS[dayIndex]}</p>
              {dayWindows.length === 0 ? (
                <p className="mt-1 text-sm text-ink/40">No disponible</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-2">
                  {dayWindows.map((w) => (
                    <span key={w.id} className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 text-sm text-ink/70">
                      {w.startTime}–{w.endTime}
                      <button onClick={() => handleRemove(w.id)} className="text-moss-600 hover:text-moss-700" aria-label="Eliminar bloque">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
