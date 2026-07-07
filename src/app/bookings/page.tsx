'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import Avatar from '@/components/Avatar';

interface BookingItem {
  id: string;
  datetime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  service: { name: string; price: number };
  professional: { id: string; photoUrl: string | null; user: { name: string } };
  review: { id: string } | null;
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

const MIN_CANCEL_NOTICE_HOURS = 2;

function hoursUntil(datetime: string): number {
  return (new Date(datetime).getTime() - Date.now()) / (1000 * 60 * 60);
}

export default function MyBookingsPage() {
  const { status } = useSession();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<{ id: string; message: string } | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/bookings')
      .then((res) => res.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar esta cita?')) return;
    setCancelError(null);

    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCancelError({ id, message: data?.error ?? 'No se pudo cancelar la cita.' });
      return;
    }

    load();
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Inicia sesión para ver tus citas</h1>
        <Link href="/login?callbackUrl=/bookings" className="btn-primary mt-6 inline-flex">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Mis citas</h1>

      {loading ? (
        <p className="mt-6 text-sm text-ink/50">Cargando…</p>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-xl bg-sand px-4 py-8 text-center">
          <p className="text-sm text-ink/60">Aún no tienes citas.</p>
          <Link href="/professionals" className="btn-primary mt-4 inline-flex">
            Buscar un profesional
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-ink">{b.service.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar name={b.professional.user.name} photoUrl={b.professional.photoUrl} size="sm" />
                    <p className="text-sm text-ink/60">con {b.professional.user.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink/50">
                    {new Date(b.datetime).toLocaleString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                  {STATUS_LABELS[b.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex gap-3">
                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') &&
                    (hoursUntil(b.datetime) >= MIN_CANCEL_NOTICE_HOURS ? (
                      <button onClick={() => cancelBooking(b.id)} className="text-sm font-medium text-moss-600 hover:underline">
                        Cancelar cita
                      </button>
                    ) : (
                      <span className="text-xs text-stone">
                        Ya no se puede cancelar en línea (faltan menos de {MIN_CANCEL_NOTICE_HOURS} horas) — contacta a tu profesional directamente.
                      </span>
                    ))}
                  {b.status === 'COMPLETED' && !b.review && reviewingId !== b.id && (
                    <button onClick={() => setReviewingId(b.id)} className="text-sm font-medium text-moss-600 hover:underline">
                      Dejar una reseña
                    </button>
                  )}
                  {b.status === 'COMPLETED' && b.review && (
                    <span className="text-sm text-clay-600">¡Gracias por tu reseña! ✓</span>
                  )}
                </div>
                {cancelError?.id === b.id && <p className="text-xs text-red-600">{cancelError.message}</p>}
              </div>

              {reviewingId === b.id && (
                <div className="mt-4">
                  <ReviewForm
                    bookingId={b.id}
                    onSubmitted={() => {
                      setReviewingId(null);
                      load();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
