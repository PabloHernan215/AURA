'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BookingSlotPicker from '@/components/BookingSlotPicker';
import Avatar from '@/components/Avatar';

interface ServiceInfo {
  id: string;
  name: string;
  price: number;
  duration: number;
  photoUrl: string | null;
}
interface ProfessionalInfo {
  id: string;
  name: string;
  photoUrl: string | null;
  businessName: string;
  businessLocation: string | null;
}

export default function BookingPage({
  params,
}: {
  params: { professionalId: string; serviceId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [service, setService] = useState<ServiceInfo | null>(null);
  const [professional, setProfessional] = useState<ProfessionalInfo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`/api/professionals/${params.professionalId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfessional({
          id: params.professionalId,
          name: data.name,
          photoUrl: data.photoUrl ?? null,
          businessName: data.business?.name ?? '',
          businessLocation: data.business?.location ?? null,
        });
        const svc = data.services.find((s: ServiceInfo) => s.id === params.serviceId);
        setService(svc ?? null);
      });

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setPaymentMethods(data.paymentMethods ?? ''));
  }, [params.professionalId, params.serviceId]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professionalId: params.professionalId,
        serviceId: params.serviceId,
        datetime: selectedSlot,
        notes,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? 'Algo salió mal');
      setSelectedSlot(null);
      return;
    }

    setConfirmed(true);
  }

  if (status === 'loading' || !service || !professional) {
    return <div className="mx-auto max-w-2xl px-5 py-16 text-center text-sm text-ink/50">Cargando…</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Inicia sesión para reservar</h1>
        <p className="mt-2 text-sm text-ink/60">Necesitas una cuenta para reservar esta cita.</p>
        <Link
          href={`/login?callbackUrl=/book/${params.professionalId}/${params.serviceId}`}
          className="btn-primary mt-6 inline-flex"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (session?.user.role !== 'CLIENT') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Se requiere una cuenta de cliente</h1>
        <p className="mt-2 text-sm text-ink/60">Solo las cuentas de cliente pueden reservar citas.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clay-100 text-clay-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">¡Tu cita está confirmada!</h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Avatar name={professional.name} photoUrl={professional.photoUrl} size="sm" />
          <span className="text-sm font-medium text-ink">{professional.name}</span>
        </div>

        <div className="card mt-5 space-y-2 p-5 text-left text-sm">
          <p className="text-ink/70">
            <span className="font-semibold text-ink">💇 Servicio:</span> {service.name}
          </p>
          <p className="text-ink/70">
            <span className="font-semibold text-ink">🗓️ Fecha:</span>{' '}
            {new Date(selectedSlot!).toLocaleString('es-ES', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {professional.businessLocation && (
            <p className="text-ink/70">
              <span className="font-semibold text-ink">📍 Dirección:</span> {professional.businessLocation}
            </p>
          )}
          {paymentMethods && (
            <p className="text-ink/70">
              <span className="font-semibold text-ink">💳 Formas de pago:</span> {paymentMethods}
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-ink/40">
          Tu profesional ya puede ver esta reserva y contactarte para coordinar cualquier detalle.
        </p>

        <Link href="/locales" className="btn-primary mt-6 inline-flex">
          Reservar otra
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/professionals/${professional.id}`} className="text-sm text-ink/50 hover:text-ink">
        ← Volver al perfil
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Reservar {service.name}</h1>
      <div className="mt-3 flex items-center gap-3">
        {service.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.photoUrl} alt={service.name} className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <Avatar name={professional.name} photoUrl={professional.photoUrl} size="sm" />
            <p className="text-sm text-ink/60">con {professional.name} · {professional.businessName}</p>
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {service.duration} min · ${service.price}
          </p>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <p className="label">Elige un horario</p>
        <BookingSlotPicker
          professionalId={params.professionalId}
          serviceId={params.serviceId}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      </div>

      <div className="card mt-4 p-5">
        <label className="label">Notas para tu profesional (opcional)</label>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Algo que deban saber antes de tu cita"
        />
      </div>

      <div className="card mt-4 space-y-2 p-5 text-sm">
        {professional.businessLocation && (
          <p className="text-ink/70">
            <span className="font-semibold text-ink">📍 Dirección:</span> {professional.businessLocation}
          </p>
        )}
        {paymentMethods && (
          <p className="text-ink/70">
            <span className="font-semibold text-ink">💳 Formas de pago:</span> {paymentMethods}
          </p>
        )}
        <p className="text-ink/50">
          Al confirmar, tu profesional verá tu reserva junto con tu número de WhatsApp para coordinar cualquier detalle contigo.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-moss-600">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!selectedSlot || submitting}
        className="btn-primary mt-6 w-full"
      >
        {submitting ? 'Confirmando…' : selectedSlot ? 'Confirmar reserva' : 'Selecciona un horario para continuar'}
      </button>
      <p className="mt-3 text-center text-xs text-ink/40">Se paga en el estudio — no se requiere tarjeta.</p>
    </div>
  );
}
