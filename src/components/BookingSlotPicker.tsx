'use client';

import { useEffect, useMemo, useState } from 'react';

interface BookingSlotPickerProps {
  professionalId: string;
  serviceId: string;
  onSelectSlot: (isoStart: string) => void;
  selectedSlot: string | null;
}

interface Slot {
  start: string;
  end: string;
}

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BookingSlotPicker({
  professionalId,
  serviceId,
  onSelectSlot,
  selectedSlot,
}: BookingSlotPickerProps) {
  const days = useMemo(() => nextNDays(14), []);
  const [activeDay, setActiveDay] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(
      `/api/availability?professionalId=${professionalId}&serviceId=${serviceId}&date=${toDateParam(activeDay)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setSlots(data.slots ?? []);
      })
      .catch(() => !cancelled && setError('No se pudo cargar la disponibilidad'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [activeDay, professionalId, serviceId]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => {
          const isActive = toDateParam(day) === toDateParam(activeDay);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setActiveDay(day)}
              className={`flex min-w-[64px] flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-ink text-white' : 'bg-sand text-ink/70 hover:bg-ink/10'
              }`}
            >
              <span className="text-xs uppercase tracking-wide opacity-70">
                {day.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <span className="font-display text-lg font-semibold">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando horarios disponibles…</p>
        ) : error ? (
          <p className="text-sm text-moss-600">{error}</p>
        ) : slots.length === 0 ? (
          <p className="rounded-xl bg-sand px-4 py-3 text-sm text-ink/60">
            No hay horarios disponibles este día. Prueba otra fecha.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot.start;
              const time = new Date(slot.start).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <button
                  key={slot.start}
                  onClick={() => onSelectSlot(slot.start)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-moss-500 bg-moss-500 text-white'
                      : 'border-ink/10 bg-white text-ink hover:border-moss-300'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
