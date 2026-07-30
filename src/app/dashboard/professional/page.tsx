'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { resizeImageToBase64 } from '@/lib/image';

interface PendingBooking {
  id: string;
  datetime: string;
  client: { name: string };
  service: { name: string };
}

interface ProfileData {
  id: string;
  bio: string;
  specialties: string;
  whatsapp: string;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  business: { id: string; name: string; isApproved: boolean; location: string | null };
  pendingBookings: PendingBooking[];
  services: { id: string }[];
  availability: { id: string }[];
}

export default function ProfessionalDashboardPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch('/api/professionals/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setProfileId(data.id);
          setProfile(data);
          setBio(data.bio ?? '');
          setSpecialties(data.specialties ?? '');
          setWhatsapp(data.whatsapp ?? '');
          setPhotoUrl(data.photoUrl ?? null);
        }
      });
  }

  useEffect(() => {
    if (status !== 'authenticated' || session?.user.role !== 'PROFESSIONAL') return;
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
      const resized = await resizeImageToBase64(file);
      setPhotoUrl(resized);
    } catch {
      setPhotoError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!profileId) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/professionals/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, specialties, whatsapp, photoUrl: photoUrl ?? '' }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  if (status === 'loading') return null;

  if (status === 'unauthenticated' || session?.user.role !== 'PROFESSIONAL') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Se requiere una cuenta de profesional</h1>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const pendingCount = profile?.pendingBookings.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center gap-3">
        <Avatar name={session.user.name} photoUrl={photoUrl} size="md" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Bienvenido/a, {session.user.name}</h1>
          <p className="mt-0.5 text-sm text-ink/60">Gestiona tu perfil público, servicios y horario.</p>
        </div>
      </div>

      {profile && (
        <p className="mt-2 text-sm text-ink/60">
          Trabajas en{' '}
          <Link href={`/locales/${profile.business.id}`} className="font-medium text-moss-600 hover:underline">
            {profile.business.name}
          </Link>
        </p>
      )}

      {profile && !profile.business.isApproved && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <span className="mt-0.5 text-amber-500">●</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Tu local está pendiente de aprobación</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Un administrador de AURA debe revisar y aprobar el local antes de que puedas aparecer en las
              búsquedas o recibir reservas. Mientras tanto, puedes completar tu perfil, agregar servicios
              y configurar tu horario para estar listo apenas lo aprueben.
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
            {profile!.pendingBookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <div>
                  <p className="font-medium text-ink">
                    <span className="font-semibold">{b.client.name}</span> · {b.service.name}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/professional/services" className="card p-4 hover:border-moss-300">
          <p className="font-display font-semibold text-ink">Servicios</p>
          <p className="mt-1 text-sm text-ink/50">{profile?.services.length ?? 0} publicados</p>
        </Link>
        <Link href="/dashboard/professional/availability" className="card p-4 hover:border-moss-300">
          <p className="font-display font-semibold text-ink">Horario</p>
          <p className="mt-1 text-sm text-ink/50">{profile?.availability.length ?? 0} bloques semanales</p>
        </Link>
        <Link
          href="/dashboard/professional/bookings"
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
      </div>

      <div className="card mt-8 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Perfil público</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Foto de perfil</label>
            <div className="flex items-center gap-4">
              <Avatar name={session.user.name} photoUrl={photoUrl} size="lg" />
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
                <p className="mt-1.5 text-xs text-ink/40">
                  Se mostrará junto a tu nombre en toda la plataforma. JPG o PNG.
                </p>
                {photoError && <p className="mt-1 text-xs text-moss-600">{photoError}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Biografía</label>
            <textarea className="input" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntale a tus clientes sobre tu experiencia y estilo" />
          </div>
          <div>
            <label className="label">Especialidades (separadas por coma)</label>
            <input className="input" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Cabello, Color, Balayage" />
          </div>
          <div>
            <label className="label">Número de WhatsApp</label>
            <input
              type="tel"
              className="input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+52 55 1234 5678"
            />
            <p className="mt-1 text-xs text-ink/40">
              Lo usamos para avisarte por WhatsApp cuando recibas una nueva reserva. Nunca se muestra públicamente.
            </p>
          </div>

          <button onClick={handleSave} disabled={saving || !profileId} className="btn-primary">
            {saving ? 'Guardando…' : 'Guardar perfil'}
          </button>
          {saved && <span className="ml-3 text-sm text-clay-600">Guardado ✓</span>}
        </div>
      </div>
    </div>
  );
}
