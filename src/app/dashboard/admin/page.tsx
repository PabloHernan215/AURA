'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { resizeImageToBase64 } from '@/lib/image';

interface UserItem {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'BUSINESS_OWNER' | 'ADMIN';
  isActive: boolean;
  professionalProfile: {
    id: string;
    bio: string;
    specialties: string;
    whatsapp: string;
    photoUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
  } | null;
  ownedBusiness: {
    id: string;
    name: string;
    description: string;
    location: string | null;
    whatsapp: string;
    photoUrl: string | null;
    isApproved: boolean;
  } | null;
}

interface AdminBooking {
  id: string;
  datetime: string;
  status: string;
  isNew: boolean;
  client: { name: string; whatsapp: string };
  professional: { whatsapp: string; user: { name: string } };
  business: { name: string; location: string | null };
  service: { name: string; price: number };
}

interface AdminBusiness {
  id: string;
  name: string;
  description: string;
  location: string | null;
  whatsapp: string;
  photoUrl: string | null;
  photos: string[];
  isApproved: boolean;
  createdAt: string;
  owner: { name: string; email: string; isActive: boolean };
  professionals: { id: string }[];
}

interface Metrics {
  totalUsers: number;
  totalBusinesses: number;
  totalProfessionals: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  PROFESSIONAL: 'Profesional',
  BUSINESS_OWNER: 'Dueño de local',
  ADMIN: 'Admin',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const TAB_LABELS: Record<'pending' | 'metrics' | 'users' | 'bookings' | 'settings', string> = {
  pending: 'Aprobaciones',
  metrics: 'Métricas',
  users: 'Usuarios',
  bookings: 'Reservas',
  settings: 'Configuración',
};

function formatBookingDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildClientMessage(b: AdminBooking): string {
  const when = formatBookingDateTime(b.datetime);
  if (b.status === 'CONFIRMED') {
    return (
      `Hola ${b.client.name}, tu cita de ${b.service.name} con ${b.professional.user.name} en ${b.business.name} ` +
      `quedó confirmada para el ${when}.` +
      (b.business.location ? ` Dirección: ${b.business.location}.` : '') +
      ` — AURA`
    );
  }
  if (b.status === 'CANCELLED') {
    return `Hola ${b.client.name}, tu cita de ${b.service.name} programada para el ${when} fue cancelada. Escríbenos si tienes dudas. — AURA`;
  }
  return `Hola ${b.client.name}, recibimos tu solicitud de ${b.service.name} con ${b.professional.user.name} para el ${when}. En breve te confirmamos. — AURA`;
}

function buildProfessionalMessage(b: AdminBooking): string {
  const when = formatBookingDateTime(b.datetime);
  return (
    `Hola ${b.professional.user.name}, tienes una cita de ${b.service.name} con ${b.client.name} el ${when} ` +
    `(estado: ${BOOKING_STATUS_LABELS[b.status] ?? b.status}). — AURA`
  );
}

function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  // api.whatsapp.com/send is more reliable than wa.me for prefilling text on
  // WhatsApp Web — the wa.me shortlink sometimes drops the message on its redirect.
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<'pending' | 'metrics' | 'users' | 'bookings' | 'settings'>('pending');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    bio: '',
    specialties: '',
    proWhatsapp: '',
    businessName: '',
    businessDescription: '',
    businessLocation: '',
    businessWhatsapp: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [businessEditForm, setBusinessEditForm] = useState({
    name: '',
    description: '',
    location: '',
    whatsapp: '',
    photoUrl: '' as string | null,
    photos: [] as string[],
  });
  const [savingBusinessEdit, setSavingBusinessEdit] = useState(false);
  const [businessEditError, setBusinessEditError] = useState('');
  const [uploadingBusinessPhoto, setUploadingBusinessPhoto] = useState(false);
  const [businessPhotoError, setBusinessPhotoError] = useState('');
  const [uploadingBusinessGalleryPhoto, setUploadingBusinessGalleryPhoto] = useState(false);
  const [businessGalleryError, setBusinessGalleryError] = useState('');
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);
  const businessGalleryInputRef = useRef<HTMLInputElement>(null);
  const MAX_BUSINESS_GALLERY_PHOTOS = 5;

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/bookings').then((r) => r.json()),
      fetch('/api/admin/businesses').then((r) => r.json()),
      fetch('/api/admin/settings').then((r) => r.json()),
    ])
      .then(([usersData, bookingsData, businessesData, settingsData]) => {
        setUsers(usersData);
        setBookings(bookingsData.bookings ?? []);
        setNewBookingsCount(bookingsData.newBookingsCount ?? 0);
        setMetrics(bookingsData.metrics ?? null);
        setBusinesses(businessesData);
        setPaymentMethods(settingsData.paymentMethods ?? '');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'ADMIN') load();
  }, [status, session]);

  useEffect(() => {
    if (tab === 'bookings' && newBookingsCount > 0) {
      fetch('/api/admin/bookings/mark-viewed', { method: 'POST' })
        .then(() => setNewBookingsCount(0))
        .catch(() => {});
    }
  }, [tab, newBookingsCount]);

  async function toggleUser(userId: string, isActive: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    load();
  }

  function startEdit(u: UserItem) {
    setEditError('');
    setEditingUserId(u.id);
    setEditForm({
      name: u.name,
      email: u.email,
      whatsapp: u.whatsapp,
      bio: u.professionalProfile?.bio ?? '',
      specialties: u.professionalProfile?.specialties ?? '',
      proWhatsapp: u.professionalProfile?.whatsapp ?? '',
      businessName: u.ownedBusiness?.name ?? '',
      businessDescription: u.ownedBusiness?.description ?? '',
      businessLocation: u.ownedBusiness?.location ?? '',
      businessWhatsapp: u.ownedBusiness?.whatsapp ?? '',
    });
  }

  async function saveEdit(u: UserItem) {
    setSavingEdit(true);
    setEditError('');

    const userRes = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, email: editForm.email, whatsapp: editForm.whatsapp }),
    });

    if (!userRes.ok) {
      const data = await userRes.json().catch(() => null);
      setEditError(data?.error ?? 'No se pudo guardar');
      setSavingEdit(false);
      return;
    }

    if (u.professionalProfile) {
      await fetch(`/api/professionals/${u.professionalProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editForm.bio,
          specialties: editForm.specialties,
          whatsapp: editForm.proWhatsapp,
        }),
      });
    }

    if (u.ownedBusiness) {
      await fetch(`/api/businesses/${u.ownedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.businessName,
          description: editForm.businessDescription,
          location: editForm.businessLocation,
          whatsapp: editForm.businessWhatsapp,
        }),
      });
    }

    setSavingEdit(false);
    setEditingUserId(null);
    load();
  }

  async function setApproval(businessId: string, isApproved: boolean) {
    await fetch('/api/admin/businesses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, isApproved }),
    });
    load();
  }

  function startBusinessEdit(b: AdminBusiness) {
    setBusinessEditError('');
    setBusinessPhotoError('');
    setBusinessGalleryError('');
    setEditingBusinessId(b.id);
    setBusinessEditForm({
      name: b.name,
      description: b.description,
      location: b.location ?? '',
      whatsapp: b.whatsapp,
      photoUrl: b.photoUrl,
      photos: Array.isArray(b.photos) ? b.photos : [],
    });
  }

  async function handleBusinessPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusinessPhotoError('');

    if (!file.type.startsWith('image/')) {
      setBusinessPhotoError('Selecciona un archivo de imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBusinessPhotoError('La imagen es muy pesada. Intenta con una de menos de 8 MB.');
      return;
    }

    setUploadingBusinessPhoto(true);
    try {
      const resized = await resizeImageToBase64(file, 800, 0.82);
      setBusinessEditForm((f) => ({ ...f, photoUrl: resized }));
    } catch {
      setBusinessPhotoError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setUploadingBusinessPhoto(false);
    }
  }

  async function handleBusinessGalleryPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusinessGalleryError('');

    if (!file.type.startsWith('image/')) {
      setBusinessGalleryError('Selecciona un archivo de imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBusinessGalleryError('La imagen es muy pesada. Intenta con una de menos de 8 MB.');
      return;
    }
    if (businessEditForm.photos.length >= MAX_BUSINESS_GALLERY_PHOTOS) {
      setBusinessGalleryError(`Ya tiene ${MAX_BUSINESS_GALLERY_PHOTOS} fotos. Elimina una para agregar otra.`);
      return;
    }

    setUploadingBusinessGalleryPhoto(true);
    try {
      const resized = await resizeImageToBase64(file, 800, 0.82);
      setBusinessEditForm((f) => ({ ...f, photos: [...f.photos, resized] }));
    } catch {
      setBusinessGalleryError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setUploadingBusinessGalleryPhoto(false);
      if (businessGalleryInputRef.current) businessGalleryInputRef.current.value = '';
    }
  }

  function removeBusinessGalleryPhoto(index: number) {
    setBusinessEditForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  }

  async function saveBusinessEdit(businessId: string) {
    setSavingBusinessEdit(true);
    setBusinessEditError('');
    const res = await fetch(`/api/businesses/${businessId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: businessEditForm.name,
        description: businessEditForm.description,
        location: businessEditForm.location,
        whatsapp: businessEditForm.whatsapp,
        photoUrl: businessEditForm.photoUrl ?? '',
        photos: businessEditForm.photos,
      }),
    });
    setSavingBusinessEdit(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setBusinessEditError(data?.error ?? 'No se pudo guardar');
      return;
    }

    setEditingBusinessId(null);
    load();
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethods }),
    });
    setSavingSettings(false);
    if (res.ok) setSettingsSaved(true);
  }

  function renderBusinessEditForm() {
    return (
      <div className="mt-4 space-y-4 border-t border-ink/8 pt-4">
        <div>
          <label className="label">Foto de portada</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
              {businessEditForm.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={businessEditForm.photoUrl} alt="Vista previa" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink/30">🏠</div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => businessPhotoInputRef.current?.click()}
                disabled={uploadingBusinessPhoto}
                className="btn-secondary py-1.5 text-xs"
              >
                {uploadingBusinessPhoto ? 'Procesando…' : 'Cambiar foto'}
              </button>
              <input
                ref={businessPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBusinessPhotoChange}
              />
              {businessPhotoError && <p className="mt-1 text-xs text-moss-600">{businessPhotoError}</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="label">
            Fotos del local ({businessEditForm.photos.length}/{MAX_BUSINESS_GALLERY_PHOTOS})
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            {businessEditForm.photos.map((p, i) => (
              <div key={i} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeBusinessGalleryPhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Quitar foto ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {businessEditForm.photos.length < MAX_BUSINESS_GALLERY_PHOTOS && (
              <button
                type="button"
                onClick={() => businessGalleryInputRef.current?.click()}
                disabled={uploadingBusinessGalleryPhoto}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-ink/20 text-xs font-medium text-ink/50 hover:border-moss-300 hover:text-moss-600"
              >
                {uploadingBusinessGalleryPhoto ? '…' : '+ Agregar'}
              </button>
            )}
            <input
              ref={businessGalleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBusinessGalleryPhotoChange}
            />
          </div>
          {businessGalleryError && <p className="mt-1 text-xs text-moss-600">{businessGalleryError}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nombre del local</label>
            <input
              className="input"
              value={businessEditForm.name}
              onChange={(e) => setBusinessEditForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">WhatsApp del local</label>
            <input
              type="tel"
              className="input"
              value={businessEditForm.whatsapp}
              onChange={(e) => setBusinessEditForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="+593 99 123 4567"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dirección</label>
            <input
              className="input"
              value={businessEditForm.location}
              onChange={(e) => setBusinessEditForm((f) => ({ ...f, location: e.target.value }))}
            />
            <p className="mt-1 text-xs text-ink/40">Si la cambias, se recalcula la ubicación automáticamente.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={2}
              value={businessEditForm.description}
              onChange={(e) => setBusinessEditForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        {businessEditError && <p className="text-sm text-moss-600">{businessEditError}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => saveBusinessEdit(editingBusinessId!)}
            disabled={savingBusinessEdit}
            className="btn-primary py-2 text-sm"
          >
            {savingBusinessEdit ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button onClick={() => setEditingBusinessId(null)} className="btn-secondary py-2 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading') return null;

  if (status === 'unauthenticated' || session?.user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Se requiere acceso de administrador</h1>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const pendingBusinesses = businesses.filter((b) => !b.isApproved);
  const approvedBusinesses = businesses.filter((b) => b.isApproved);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Panel de administración</h1>

      <div className="mt-4 flex gap-2">
        {(['pending', 'metrics', 'users', 'bookings', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-ink text-white' : 'bg-sand text-ink/70 hover:bg-ink/10'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'pending' && pendingBusinesses.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-moss-500 px-1 text-xs font-semibold text-white">
                {pendingBusinesses.length}
              </span>
            )}
            {t === 'bookings' && newBookingsCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-moss-500 px-1 text-xs font-semibold text-white">
                {newBookingsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink/50">Cargando…</p>
      ) : (
        <div className="mt-8">
          {tab === 'pending' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Locales pendientes de aprobación {pendingBusinesses.length > 0 && `(${pendingBusinesses.length})`}
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  Estos locales se registraron pero aún no son visibles en la plataforma ni pueden recibir reservas.
                </p>

                {pendingBusinesses.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-sand px-4 py-6 text-center text-sm text-ink/60">
                    No hay solicitudes pendientes por ahora.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingBusinesses.map((b) => (
                      <div key={b.id} className="card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <Avatar name={b.name} photoUrl={b.photoUrl} size="md" />
                            <div>
                              <h3 className="font-display font-semibold text-ink">{b.name}</h3>
                              <p className="text-sm text-ink/60">{b.owner.name} · {b.owner.email}</p>
                              {b.location && <p className="mt-1 text-sm text-ink/50">{b.location}</p>}
                              {b.description && <p className="mt-2 text-sm text-ink/70">{b.description}</p>}
                              <p className="mt-2 text-xs text-ink/40">
                                Registrado el {new Date(b.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })} ·{' '}
                                {b.professionals.length} profesional(es)
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => (editingBusinessId === b.id ? setEditingBusinessId(null) : startBusinessEdit(b))}
                              className="btn-secondary py-2 text-sm"
                            >
                              {editingBusinessId === b.id ? 'Cerrar' : 'Editar'}
                            </button>
                            <button onClick={() => setApproval(b.id, true)} className="btn-primary py-2 text-sm">
                              Aprobar
                            </button>
                          </div>
                        </div>
                        {editingBusinessId === b.id && renderBusinessEditForm()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {approvedBusinesses.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Ya aprobados</h2>
                  <div className="mt-4 space-y-2">
                    {approvedBusinesses.map((b) => (
                      <div key={b.id} className="card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={b.name} photoUrl={b.photoUrl} size="sm" />
                            <div>
                              <p className="font-medium text-ink">{b.name}</p>
                              <p className="text-sm text-ink/50">{b.owner.name} · {b.owner.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => (editingBusinessId === b.id ? setEditingBusinessId(null) : startBusinessEdit(b))}
                              className="text-xs font-semibold text-clay-600 hover:underline"
                            >
                              {editingBusinessId === b.id ? 'Cerrar' : 'Editar'}
                            </button>
                            <button
                              onClick={() => setApproval(b.id, false)}
                              className="text-xs font-semibold text-moss-600 hover:underline"
                            >
                              Revocar aprobación
                            </button>
                          </div>
                        </div>
                        {editingBusinessId === b.id && renderBusinessEditForm()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'metrics' && metrics && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Usuarios totales', value: metrics.totalUsers },
                { label: 'Locales', value: metrics.totalBusinesses },
                { label: 'Profesionales', value: metrics.totalProfessionals },
                { label: 'Reservas totales', value: metrics.totalBookings },
                { label: 'Citas completadas', value: metrics.completedBookings },
                { label: 'Ingresos (completadas)', value: `$${metrics.totalRevenue.toFixed(2)}` },
              ].map((m) => (
                <div key={m.label} className="card p-5">
                  <p className="label">{m.label}</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ink">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/50">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <Fragment key={u.id}>
                      <tr className="border-b border-ink/5 last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">
                          <div className="flex items-center gap-2.5">
                            {u.role === 'PROFESSIONAL' && (
                              <Avatar name={u.name} photoUrl={u.professionalProfile?.photoUrl ?? null} size="sm" />
                            )}
                            <div>
                              {u.name}
                              {u.ownedBusiness && (
                                <p className="text-xs font-normal text-ink/40">{u.ownedBusiness.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink/60">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink/70">{ROLE_LABELS[u.role]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? 'bg-clay-50 text-clay-600' : 'bg-moss-50 text-moss-600'}`}>
                            {u.isActive ? 'Activo' : 'Deshabilitado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => (editingUserId === u.id ? setEditingUserId(null) : startEdit(u))}
                              className="text-xs font-semibold text-clay-600 hover:underline"
                            >
                              {editingUserId === u.id ? 'Cerrar' : 'Editar'}
                            </button>
                            {u.role !== 'ADMIN' && (
                              <button onClick={() => toggleUser(u.id, u.isActive)} className="text-xs font-semibold text-moss-600 hover:underline">
                                {u.isActive ? 'Deshabilitar' : 'Habilitar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {editingUserId === u.id && (
                        <tr className="border-b border-ink/5 bg-sand/40">
                          <td colSpan={5} className="px-4 py-5">
                            <div className="space-y-4">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Datos de la cuenta</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div>
                                    <label className="label">Nombre</label>
                                    <input
                                      className="input"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="label">Correo</label>
                                    <input
                                      type="email"
                                      className="input"
                                      value={editForm.email}
                                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="label">WhatsApp</label>
                                    <input
                                      type="tel"
                                      className="input"
                                      value={editForm.whatsapp}
                                      onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                                      placeholder="+593 99 123 4567"
                                    />
                                  </div>
                                </div>
                              </div>

                              {u.professionalProfile && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Perfil profesional</p>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                      <label className="label">Especialidades</label>
                                      <input
                                        className="input"
                                        value={editForm.specialties}
                                        onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                                        placeholder="Cabello, Color"
                                      />
                                    </div>
                                    <div>
                                      <label className="label">WhatsApp profesional</label>
                                      <input
                                        type="tel"
                                        className="input"
                                        value={editForm.proWhatsapp}
                                        onChange={(e) => setEditForm({ ...editForm, proWhatsapp: e.target.value })}
                                        placeholder="+593 99 123 4567"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="label">Biografía</label>
                                      <textarea
                                        className="input"
                                        rows={2}
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {u.ownedBusiness && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Local</p>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="label">Nombre del local</label>
                                      <input
                                        className="input"
                                        value={editForm.businessName}
                                        onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="label">WhatsApp del local</label>
                                      <input
                                        type="tel"
                                        className="input"
                                        value={editForm.businessWhatsapp}
                                        onChange={(e) => setEditForm({ ...editForm, businessWhatsapp: e.target.value })}
                                        placeholder="+593 99 123 4567"
                                      />
                                    </div>
                                    <div>
                                      <label className="label">Dirección</label>
                                      <input
                                        className="input"
                                        value={editForm.businessLocation}
                                        onChange={(e) => setEditForm({ ...editForm, businessLocation: e.target.value })}
                                      />
                                      <p className="mt-1 text-xs text-ink/40">Si la cambias, se recalcula la ubicación automáticamente.</p>
                                    </div>
                                    <div>
                                      <label className="label">Descripción</label>
                                      <textarea
                                        className="input"
                                        rows={1}
                                        value={editForm.businessDescription}
                                        onChange={(e) => setEditForm({ ...editForm, businessDescription: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {editError && <p className="text-sm text-moss-600">{editError}</p>}

                              <div className="flex gap-3">
                                <button onClick={() => saveEdit(u)} disabled={savingEdit} className="btn-primary py-2 text-sm">
                                  {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="btn-secondary py-2 text-sm">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'bookings' && (
            <div>
              {newBookingsCount > 0 && (
                <p className="mb-4 text-sm text-ink/60">
                  Tienes <span className="font-semibold text-moss-600">{newBookingsCount}</span> reserva
                  {newBookingsCount === 1 ? '' : 's'} nueva{newBookingsCount === 1 ? '' : 's'} desde tu última visita.
                </p>
              )}
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <p className="rounded-xl bg-sand px-4 py-6 text-center text-sm text-ink/60">Aún no hay reservas.</p>
                ) : (
                  bookings.map((b) => (
                    <div
                      key={b.id}
                      className={`card flex flex-col gap-3 p-4 ${b.isNew ? 'border-moss-300 bg-moss-50/40' : ''}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {b.isNew && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-moss-500 px-2 py-0.5 text-xs font-semibold text-white">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              Nueva
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-ink">
                              {b.service.name} · {b.client.name} → {b.professional.user.name} ({b.business.name})
                            </p>
                            <p className="text-sm text-ink/50">
                              {new Date(b.datetime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                              {' · '}${b.service.price}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink/70">
                          {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-ink/8 pt-3">
                        {b.client.whatsapp ? (
                          <a
                            href={waLink(b.client.whatsapp, buildClientMessage(b))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-moss-50 px-3 py-1.5 text-xs font-semibold text-moss-600 hover:bg-moss-100"
                          >
                            💬 WhatsApp al cliente
                          </a>
                        ) : (
                          <span className="text-xs text-ink/30">Cliente sin WhatsApp</span>
                        )}
                        {b.professional.whatsapp ? (
                          <a
                            href={waLink(b.professional.whatsapp, buildProfessionalMessage(b))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 px-3 py-1.5 text-xs font-semibold text-clay-600 hover:bg-clay-100"
                          >
                            💬 WhatsApp al profesional
                          </a>
                        ) : (
                          <span className="text-xs text-ink/30">Profesional sin WhatsApp</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="card max-w-xl p-5">
              <h2 className="font-display text-lg font-semibold text-ink">Formas de pago</h2>
              <p className="mt-1 text-sm text-ink/60">
                Este texto se incluye en cada confirmación de reserva por WhatsApp y se muestra a los
                clientes al momento de reservar. AURA aún no procesa pagos en línea — esto es solo
                información para que el cliente sepa cómo pagar en el estudio.
              </p>
              <textarea
                className="input mt-4"
                rows={3}
                value={paymentMethods}
                onChange={(e) => {
                  setPaymentMethods(e.target.value);
                  setSettingsSaved(false);
                }}
                placeholder="Efectivo, transferencia bancaria o tarjeta directamente en el estudio."
              />
              <button onClick={saveSettings} disabled={savingSettings} className="btn-primary mt-3">
                {savingSettings ? 'Guardando…' : 'Guardar'}
              </button>
              {settingsSaved && <span className="ml-3 text-sm text-clay-600">Guardado ✓</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
