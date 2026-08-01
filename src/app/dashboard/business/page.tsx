'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { resizeImageToBase64 } from '@/lib/image';

interface BusinessData {
  id: string;
  name: string;
  description: string;
  location: string | null;
  whatsapp: string;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  isApproved: boolean;
  pendingBookings: {
    id: string;
    datetime: string;
    client: { name: string };
    service: { name: string };
    professional: { user: { name: string } };
  }[];
  professionals: {
    id: string;
    user: { name: string; email: string; isActive: boolean };
    services: { id: string }[];
  }[];
}

export default function BusinessDashboardPage() {
  const { data: session, status } = useSession();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function load() {
    fetch('/api/businesses/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setBusiness(data);
          setName(data.name ?? '');
          setDescription(data.description ?? '');
          setLocation(data.location ?? '');
          setWhatsapp(data.whatsapp || '+593 ');
          setPhotoUrl(data.photoUrl ?? null);
        }
      });
  }

  useEffect(() => {
    if (status !== 'authenticated' || session?.user.role !== 'BUSINESS_OWNER') return;
    load();
  }, [status, session]);

  async function confirmBooking(id: string) {
    setConfirmingId(id);
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    setConfirmingId(null);
    load();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecciona un archivo de imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('La imagen es muy pesada. Intenta con una de menos de 8 MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const resized = await resizeImageToBase64(file, 800, 0.82);
      setPhotoUrl(resized);
    } catch {
      setPhotoError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/businesses/${business.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, location, whatsapp, photoUrl: photoUrl ?? '' }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  if (status === 'loading') return null;

  if (status === 'unauthenticated' || session?.user.role !== 'BUSINESS_OWNER') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Se requiere una cuenta de dueño de local</h1>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const pendingCount = business?.pendingBookings.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Bienvenido/a, {session.user.name}</h1>
      <p className="mt-1 text-sm text-ink/60">Gestiona tu local, su equipo y sus reservas.</p>

      {business && !business.isApproved && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <span className="mt-0.5 text-amber-500">●</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Tu local está pendiente de aprobación</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Un administrador de AURA debe revisarlo antes de que aparezca en las búsquedas o pueda
              recibir reservas. Mientras tanto, completa el perfil y agrega a tu equipo.
            </p>
          </div>
        </div>
      )}

      {/* Aviso grande de citas nuevas — lo primero que se ve al entrar */}
      {pendingCount > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-moss-300 bg-moss-50 p-6">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-moss-500 animate-pulseSoft" />
            <h2 className="font-display text-2xl font-semibold text-ink">
              {pendingCount === 1 ? 'Tienes 1 cita nueva' : `Tienes ${pendingCount} citas nuevas`}
            </h2>
          </div>
          <p className="mt-1 text-sm text-moss-700">Confírmalas para avisarle al cliente por WhatsApp.</p>

          <div className="mt-4 space-y-3">
            {business!.pendingBookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <div>
                  <p className="font-medium text-ink">
                    <span className="font-semibold">{b.client.name}</span> · {b.service.name} · con{' '}
                    {b.professional.user.name}
                  </p>
                  <p className="text-sm text-ink/50">
                    {new Date(b.datetime).toLocaleString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => confirmBooking(b.id)}
                  disabled={confirmingId === b.id}
                  className="btn-primary py-2 text-sm"
                >
                  {confirmingId === b.id ? 'Confirmando…' : 'Confirmar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/business/bookings"
          className={`card p-4 hover:border-moss-300 ${pendingCount > 0 ? 'border-moss-300 bg-moss-50/40' : ''}`}
        >
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-ink">Reservas</p>
            {pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-moss-500 animate-pulseSoft" />}
          </div>
          {pendingCount > 0 ? (
            <p className="mt-1 font-display text-3xl font-semibold text-moss-600">
              {pendingCount} <span className="font-body text-sm font-normal text-moss-500">por confirmar</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink/50">Sin reservas nuevas</p>
          )}
        </Link>
        <div className="card p-4">
          <p className="font-display font-semibold text-ink">Equipo</p>
          <p className="mt-1 text-sm text-ink/50">
            {business?.professionals.length ?? 0} profesional{business?.professionals.length === 1 ? '' : 'es'}
          </p>
        </div>
      </div>

      {business && business.professionals.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Tu equipo</h2>
          <p className="mt-1 text-sm text-ink/60">
            Cada profesional gestiona sus propios servicios y horario desde su propia cuenta.
          </p>
          <div className="mt-4 space-y-2">
            {business.professionals.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-sand/60 px-3.5 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink">{p.user.name}</p>
                  <p className="text-xs text-ink/50">{p.user.email}</p>
                </div>
                <span className="text-xs text-ink/40">{p.services.length} servicio(s)</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Para agregar más profesionales, pídeles que se registren en AURA eligiendo tu local desde el
            formulario de registro.
          </p>
        </div>
      )}

      <div className="card mt-6 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Perfil del local</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Foto del local</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink/30">
                    <span className="text-2xl">🏠</span>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn-secondary py-2 text-sm"
                >
                  {uploadingPhoto ? 'Procesando…' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoError && <p className="mt-1 text-xs text-moss-600">{photoError}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Nombre del local</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="AURA Hub - Centro" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cuéntale a tus clientes sobre tu local" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Calle, número, colonia, ciudad" />
            <p className="mt-1 text-xs text-ink/40">
              Usa una dirección real y completa — así los clientes ven qué tan cerca están de ti.
            </p>
          </div>
          <div>
            <label className="label">Número de WhatsApp del local</label>
            <input
              type="tel"
              className="input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+593 99 123 4567"
            />
          </div>

          <button onClick={handleSave} disabled={saving || !business} className="btn-primary">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {saved && <span className="ml-3 text-sm text-clay-600">Guardado ✓</span>}
        </div>
      </div>
    </div>
  );
}
