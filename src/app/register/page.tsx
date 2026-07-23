'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BusinessOption {
  id: string;
  name: string;
  location: string | null;
}

type RoleOption = 'CLIENT' | 'PROFESSIONAL' | 'BUSINESS_OWNER';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== 'PROFESSIONAL') return;
    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []));
  }, [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        whatsapp,
        businessName,
        businessLocation,
        businessId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Algo salió mal');
      setLoading(false);
      return;
    }

    const signInRes = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      router.push('/login');
      return;
    }

    const destinations: Record<RoleOption, string> = {
      PROFESSIONAL: '/dashboard/professional',
      BUSINESS_OWNER: '/dashboard/business',
      CLIENT: '/locales',
    };
    router.push(destinations[role]);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-5 py-10">
      <div className="w-full">
        <h1 className="font-display text-3xl font-semibold text-ink">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-ink/60">Reserva citas, únete a un local, o registra el tuyo.</p>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-sand p-1">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors sm:text-sm ${
              role === 'CLIENT' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setRole('PROFESSIONAL')}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors sm:text-sm ${
              role === 'PROFESSIONAL' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'
            }`}
          >
            Profesional
          </button>
          <button
            type="button"
            onClick={() => setRole('BUSINESS_OWNER')}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors sm:text-sm ${
              role === 'BUSINESS_OWNER' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'
            }`}
          >
            Dueño de un local
          </button>
        </div>

        {role === 'BUSINESS_OWNER' && (
          <p className="mt-3 rounded-xl bg-sand/60 px-3 py-2 text-xs text-ink/60">
            Tu local queda pendiente de aprobación por un administrador antes de aparecer en las
            búsquedas o poder recibir reservas.
          </p>
        )}
        {role === 'PROFESSIONAL' && (
          <p className="mt-3 rounded-xl bg-sand/60 px-3 py-2 text-xs text-ink/60">
            Te unes como profesional dentro de un local ya existente en AURA — selecciona cuál abajo.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Pérez" />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@ejemplo.com"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Al menos 6 caracteres"
            />
          </div>

          {role === 'BUSINESS_OWNER' && (
            <>
              <div>
                <label className="label">Nombre de tu local</label>
                <input
                  required
                  className="input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="AURA Hub - Centro"
                />
              </div>
              <div>
                <label className="label">Dirección de tu local</label>
                <input
                  required
                  className="input"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  placeholder="Calle, número, colonia, ciudad"
                />
                <p className="mt-1 text-xs text-ink/40">
                  Usa una dirección real y completa — así los clientes ven qué tan cerca están de ti.
                </p>
              </div>
            </>
          )}

          {role === 'PROFESSIONAL' && (
            <div>
              <label className="label">¿En qué local trabajas?</label>
              <select
                required
                className="input"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              >
                <option value="">Selecciona un local…</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.location ? ` — ${b.location}` : ''}
                  </option>
                ))}
              </select>
              {businesses.length === 0 && (
                <p className="mt-1 text-xs text-ink/40">
                  Aún no hay locales disponibles. Pídele al dueño de tu local que se registre primero.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">Número de WhatsApp</label>
            <input
              type="tel"
              required
              className="input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+52 55 1234 5678"
            />
            <p className="mt-1 text-xs text-ink/40">
              {role === 'CLIENT'
                ? 'Solo lo verá el profesional una vez que reserves con él o ella, para coordinar tu cita.'
                : 'Te avisaremos por WhatsApp cada vez que recibas una nueva reserva. Nunca se muestra públicamente.'}
            </p>
          </div>

          {error && <p className="text-sm text-moss-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-semibold text-moss-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
