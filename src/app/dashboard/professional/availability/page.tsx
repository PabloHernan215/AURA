'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import WeeklyAvailabilityForm from '@/components/professional/WeeklyAvailabilityForm';
import WeeklyScheduleGrid from '@/components/professional/WeeklyScheduleGrid';
import { Skeleton } from '@/components/Skeleton';
import type { AvailabilityWindowInput } from '@/lib/schemas';

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function ProfessionalAvailabilityPage() {
  const { status } = useSession();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleAdd(data: AvailabilityWindowInput) {
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      return { error: body.error ?? 'Algo salió mal' };
    }
    load();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/availability?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/dashboard/professional" className="text-sm text-ink/50 hover:text-ink">
        ← Panel
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Horario semanal</h1>
      <p className="mt-1 text-sm text-ink/60">
        Agrega bloques recurrentes cuando estés disponible. Los clientes solo verán horarios dentro de estos rangos.
      </p>

      <div className="mt-6">
        <WeeklyAvailabilityForm onSubmit={handleAdd} />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] w-full" />
            ))}
          </div>
        ) : (
          <WeeklyScheduleGrid windows={windows} onRemove={handleRemove} />
        )}
      </div>
    </div>
  );
}
