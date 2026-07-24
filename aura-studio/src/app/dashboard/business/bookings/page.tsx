'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface BookingItem {
  id: string;
  datetime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  client: { name: string; email: string; whatsapp: string };
  service: { name: string; price: number };
  professional: { user: { name: string } };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-clay-50 text-clay-600',
  CANCELLED: 'bg-ink/5 text-ink/40',
  COMPLETED: 'bg-moss-50 text-moss-600',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const FILTER_LABELS: Record<'UPCOMING' | 'COMPLETED' | 'ALL', string> = {
  UPCOMING: 'Próximas',
  COMPLETED: 'Completadas',
  ALL: 'Todas',
};

export default function BusinessBookingsPage() {
  const { status } = useSession();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('UPCOMING');

  function load() {
    setLoading(true);
    fetch('/api/bookings')
      .then((res) => res.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'authenticated') {
      load();
      // Resets the "new bookings" counter shown on the dashboard once the owner
      // actually looks at their bookings.
      fetch('/api/businesses/mark-viewed', { method: 'POST' }).catch(() => {});
    }
  }, [status]);

  async function updateStatus(id: string, newStatus: 'COMPLETED' | 'CANCELLED') {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    return b.status === 'PENDING' || b.status === 'CONFIRMED';
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/dashboard/business" className="text-sm text-ink/50 hover:text-ink">
        ← Panel
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Reservas del local</h1>

      <div className="mt-4 flex gap-2">
        {(['UPCOMING', 'COMPLETED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-ink text-white' : 'bg-sand text-ink/70 hover:bg-ink/10'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl bg-sand px-4 py-8 text-center text-sm text-ink/60">No hay reservas aquí.</p>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-ink">{b.service.name}</h3>
                  <p className="text-sm text-ink/60">
                    {b.client.name} · con {b.professional.user.name}
                  </p>
                  {b.client.whatsapp && (
                    <a
                      href={`https://wa.me/${b.client.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-2.5 py-1 text-xs font-semibold text-clay-600 hover:bg-clay-100"
                    >
                      💬 WhatsApp: {b.client.whatsapp}
                    </a>
                  )}
                  <p className="mt-1 text-sm text-ink/50">
                    {new Date(b.datetime).toLocaleString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {b.notes && <p className="mt-2 rounded-lg bg-sand px-3 py-2 text-sm text-ink/60">"{b.notes}"</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                  {STATUS_LABELS[b.status]}
                </span>
              </div>

              {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                <div className="mt-3 flex gap-3">
                  <button onClick={() => updateStatus(b.id, 'COMPLETED')} className="text-sm font-medium text-clay-600 hover:underline">
                    Marcar completada
                  </button>
                  <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-sm font-medium text-moss-600 hover:underline">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
