'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, whatsapp }),
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

    router.push(role === 'PROFESSIONAL' ? '/dashboard/professional' : '/professionals');
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-5 py-10">
      <div className="w-full">
        <h1 className="font-display text-3xl font-semibold text-ink">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-ink/60">Reserva citas o comienza a recibir clientes.</p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-sand p-1">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              role === 'CLIENT' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'
            }`}
          >
            Soy cliente
          </button>
          <button
            type="button"
            onClick={() => setRole('PROFESSIONAL')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              role === 'PROFESSIONAL' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'
            }`}
          >
            Soy profesional
          </button>
        </div>

        {role === 'PROFESSIONAL' && (
          <p className="mt-3 rounded-xl bg-sand/60 px-3 py-2 text-xs text-ink/60">
            Las cuentas de profesional quedan pendientes de aprobación por un administrador antes de
            aparecer en las búsquedas o poder recibir reservas.
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
              {role === 'PROFESSIONAL'
                ? 'Te avisaremos por WhatsApp cada vez que recibas una nueva reserva. Nunca se muestra públicamente.'
                : 'Solo lo verá el profesional una vez que reserves con él o ella, para coordinar tu cita.'}
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
