'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import BookingsByStatusChart from '@/components/admin/BookingsByStatusChart';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  isActive: boolean;
  professionalProfile: { photoUrl: string | null; ratingAvg: number; ratingCount: number } | null;
}

interface AdminBooking {
  id: string;
  datetime: string;
  status: string;
  isNew: boolean;
  client: { name: string };
  professional: { user: { name: string } };
  service: { name: string; price: number };
}

interface AdminProfessional {
  id: string;
  bio: string;
  specialties: string;
  isApproved: boolean;
  createdAt: string;
  photoUrl: string | null;
  user: { name: string; email: string; isActive: boolean };
  services: { id: string }[];
}

interface Metrics {
  totalUsers: number;
  totalProfessionals: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  PROFESSIONAL: 'Profesional',
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

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<'pending' | 'metrics' | 'users' | 'bookings' | 'settings'>('pending');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/bookings').then((r) => r.json()),
      fetch('/api/admin/professionals').then((r) => r.json()),
      fetch('/api/admin/settings').then((r) => r.json()),
    ])
      .then(([usersData, bookingsData, professionalsData, settingsData]) => {
        setUsers(usersData);
        setBookings(bookingsData.bookings ?? []);
        setNewBookingsCount(bookingsData.newBookingsCount ?? 0);
        setMetrics(bookingsData.metrics ?? null);
        setProfessionals(professionalsData);
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

  async function setApproval(professionalProfileId: string, isApproved: boolean) {
    await fetch('/api/admin/professionals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalProfileId, isApproved }),
    });
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

  const pendingProfessionals = professionals.filter((p) => !p.isApproved);
  const approvedProfessionals = professionals.filter((p) => p.isApproved);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Panel de administración</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(['pending', 'metrics', 'users', 'bookings', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-ink text-white' : 'bg-sand text-ink/70 hover:bg-ink/10'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'pending' && pendingProfessionals.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-moss-500 px-1 text-xs font-semibold text-white">
                {pendingProfessionals.length}
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
                  Pendientes de aprobación {pendingProfessionals.length > 0 && `(${pendingProfessionals.length})`}
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  Estos profesionales se registraron pero aún no son visibles en la plataforma ni pueden recibir reservas.
                </p>

                {pendingProfessionals.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-sand px-4 py-6 text-center text-sm text-ink/60">
                    No hay solicitudes pendientes por ahora.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingProfessionals.map((p) => (
                      <div key={p.id} className="card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <Avatar name={p.user.name} photoUrl={p.photoUrl} size="md" />
                            <div>
                              <h3 className="font-display font-semibold text-ink">{p.user.name}</h3>
                              <p className="text-sm text-ink/60">{p.user.email}</p>
                              {p.specialties && <p className="mt-1 text-sm text-ink/50">{p.specialties}</p>}
                              {p.bio && <p className="mt-2 text-sm text-ink/70">{p.bio}</p>}
                              <p className="mt-2 text-xs text-ink/40">
                                Registrado el {new Date(p.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })} ·{' '}
                                {p.services.length} servicio(s) creado(s)
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setApproval(p.id, true)} className="btn-primary py-2 text-sm">
                              Aprobar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {approvedProfessionals.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Ya aprobados</h2>
                  <div className="mt-4 space-y-2">
                    {approvedProfessionals.map((p) => (
                      <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.user.name} photoUrl={p.photoUrl} size="sm" />
                          <div>
                            <p className="font-medium text-ink">{p.user.name}</p>
                            <p className="text-sm text-ink/50">{p.user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setApproval(p.id, false)}
                          className="text-xs font-semibold text-moss-600 hover:underline"
                        >
                          Revocar aprobación
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'metrics' && metrics && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Usuarios totales', value: metrics.totalUsers },
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
              <BookingsByStatusChart bookings={bookings} />
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
                    <tr key={u.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">
                        <div className="flex items-center gap-2.5">
                          {u.role === 'PROFESSIONAL' && (
                            <Avatar name={u.name} photoUrl={u.professionalProfile?.photoUrl ?? null} size="sm" />
                          )}
                          {u.name}
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
                        {u.role !== 'ADMIN' && (
                          <button onClick={() => toggleUser(u.id, u.isActive)} className="text-xs font-semibold text-moss-600 hover:underline">
                            {u.isActive ? 'Deshabilitar' : 'Habilitar'}
                          </button>
                        )}
                      </td>
                    </tr>
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
                      className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${
                        b.isNew ? 'border-moss-300 bg-moss-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {b.isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-moss-500 px-2 py-0.5 text-xs font-semibold text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            Nueva
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-ink">
                            {b.service.name} · {b.client.name} → {b.professional.user.name}
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
