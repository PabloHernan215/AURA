import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProfessionalCard from '@/components/ProfessionalCard';

const CATEGORIES = [
  {
    name: 'Cabello',
    description: 'Cortes, color y peinado',
    href: '/professionals?specialty=Cabello',
    gradient: 'from-moss-500 to-moss-700',
    icon: (
      <path d="M12 3c-3 0-5.5 2.2-5.5 5.5 0 1.8.9 3 1.8 4.2.8 1 1.5 1.9 1.5 3.3v3l2.2-1.7 2.2 1.7v-3c0-1.4.7-2.3 1.5-3.3.9-1.2 1.8-2.4 1.8-4.2C17.5 5.2 15 3 12 3z" />
    ),
  },
  {
    name: 'Uñas',
    description: 'Manicure y pedicure',
    href: '/professionals?specialty=Uñas',
    gradient: 'from-clay-500 to-clay-600',
    icon: (
      <path d="M8 21s-1-4.5-1-8a5 5 0 0110 0c0 3.5-1 8-1 8M9 12V7a1.5 1.5 0 013 0v5M12 12V6a1.5 1.5 0 013 0v6" />
    ),
  },
  {
    name: 'Bienestar',
    description: 'Faciales y relajación',
    href: '/professionals?specialty=Bienestar',
    gradient: 'from-moss-500 to-clay-500',
    icon: (
      <path d="M12 21c-4.5-2.5-8-6-8-10.5A5.5 5.5 0 0112 6a5.5 5.5 0 018 4.5c0 4.5-3.5 8-8 10.5z" />
    ),
  },
];

const VALUE_PROPS = [
  {
    title: 'Profesionales verificados',
    body: 'Cada especialista es revisado antes de aparecer en la plataforma.',
    gradient: 'from-moss-500 to-moss-700',
    icon: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  },
  {
    title: 'Disponibilidad real',
    body: 'Ves los horarios libres de verdad, actualizados al instante.',
    gradient: 'from-clay-500 to-clay-600',
    icon: <path d="M12 7v5l3.5 2M12 21a9 9 0 100-18 9 9 0 000 18z" />,
  },
  {
    title: 'Sin sorpresas',
    body: 'Precio y forma de pago claros antes de confirmar tu cita.',
    gradient: 'from-moss-500 to-clay-500',
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    title: 'A tu ritmo',
    body: 'Reserva, reprograma o cancela cuando lo necesites.',
    gradient: 'from-clay-500 to-moss-500',
    icon: <path d="M12 22c5-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 3 8 8 12z" />,
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default async function LandingPage() {
  const featured = await prisma.professionalProfile.findMany({
    where: { isApproved: true, user: { isActive: true } },
    include: { user: { select: { name: true } }, services: { orderBy: { price: 'asc' }, take: 1 } },
    orderBy: { ratingAvg: 'desc' },
    take: 3,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-moss-700 to-clay-600">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-clay-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-moss-300/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-white/80">
                Cuidado personal, belleza y bienestar
              </span>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-clay-300 animate-pulseSoft" />
                Profesionales disponibles cerca de ti
              </div>
              <h1 className="font-display text-[2.75rem] font-medium leading-[1.1] text-white sm:text-6xl">
                Un momento
                <br />
                para ti,
                <br />
                <span className="italic text-clay-100">reservado en segundos.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
                AURA te conecta con especialistas en cabello, uñas y bienestar de confianza.
                Sin llamadas, sin esperas — solo tú, eligiendo el momento perfecto para cuidarte.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/professionals"
                  className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink shadow-lg transition-transform hover:scale-105"
                >
                  Reservar mi cita
                </Link>
                <Link href="/register" className="text-sm font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                  Soy profesional
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/70">
                Reserva en menos de un minuto · Sin registros complicados · Cancela cuando quieras
              </p>
            </div>

            <div className="relative">
              <div className="card p-7 shadow-2xl">
                <p className="label">Próxima disponibilidad</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-clay-300 to-moss-600 font-display text-lg text-white">
                    M
                  </div>
                  <div>
                    <p className="font-display text-lg text-ink">María González</p>
                    <p className="text-xs text-stone">Cabello · Color · Balayage</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-moss-50 px-2.5 py-1 text-xs font-medium text-moss-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-moss-500 animate-pulseSoft" />
                    Hoy, 2:15 p.m.
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {['2:15', '2:30', '3:00', '4:15'].map((t) => (
                    <span key={t} className="rounded-md bg-gradient-to-br from-moss-50 to-clay-50 py-2.5 text-center text-xs font-semibold text-moss-600">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-center text-xs text-stone">Así de simple es reservar en AURA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías de servicio */}
      <section className="border-y border-ink/8 bg-white py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex items-center gap-4 rounded-xl border border-ink/8 bg-white px-6 py-5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${cat.gradient} text-white`}>
                  <Icon>{cat.icon}</Icon>
                </span>
                <div>
                  <p className="font-display text-lg text-ink">{cat.name}</p>
                  <p className="text-xs text-stone">{cat.description}</p>
                </div>
                <span className="ml-auto text-ink/20 transition-transform group-hover:translate-x-1 group-hover:text-moss-500">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué elegir AURA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-lg">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-moss-600">Por qué AURA</span>
          <h2 className="mt-3 font-display text-3xl font-medium text-ink">
            Cuidado profesional, con la tranquilidad de saber qué esperar.
          </h2>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.title}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${v.gradient} text-white`}>
                <Icon>{v.icon}</Icon>
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-ink/8 bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-moss-600">Cómo funciona</span>
          <h2 className="mt-3 font-display text-3xl font-medium text-ink">Tres pasos, sin complicaciones.</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              { title: 'Elige tu especialista', body: 'Explora perfiles verificados, sus trabajos y reseñas reales de otros clientes.', gradient: 'from-moss-500 to-moss-700' },
              { title: 'Elige un horario real', body: 'Ves exactamente cuándo están disponibles — la agenda se actualiza en vivo.', gradient: 'from-clay-500 to-clay-600' },
              { title: 'Confirma y listo', body: 'Tu cita queda guardada al instante, con dirección y forma de pago claras.', gradient: 'from-moss-500 to-clay-500' },
            ].map((step, i) => (
              <div key={step.title} className="relative pl-10">
                <span className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} font-display text-sm font-semibold text-white`}>
                  {i + 1}
                </span>
                <h3 className="font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prueba social */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-3 divide-x divide-white/20 rounded-xl bg-gradient-to-r from-ink via-moss-700 to-clay-600 py-8 text-center shadow-lg">
          <div>
            <p className="font-display text-3xl text-white">+500</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Citas confirmadas</p>
          </div>
          <div>
            <p className="font-display text-3xl text-white">4.9</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Calificación promedio</p>
          </div>
          <div>
            <p className="font-display text-3xl text-white">100%</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/80">Profesionales verificados</p>
          </div>
        </div>
      </section>

      {/* Profesionales destacados */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-moss-600">Esta semana</span>
              <h2 className="mt-2 font-display text-3xl font-medium text-ink">Los mejor calificados</h2>
            </div>
            <Link href="/professionals" className="text-sm font-semibold text-moss-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                id={pro.id}
                name={pro.user.name}
                photoUrl={pro.photoUrl}
                specialties={pro.specialties}
                location={pro.location}
                ratingAvg={pro.ratingAvg}
                ratingCount={pro.ratingCount}
                startingPrice={pro.services[0]?.price}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-moss-700 to-clay-600 py-20">
        <div className="relative mx-auto max-w-2xl px-5 text-center">
          <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
            Regálate un momento de calma.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/85">
            Encuentra a tu profesional ideal y reserva en menos de un minuto.
          </p>
          <Link
            href="/professionals"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink shadow-lg transition-transform hover:scale-105"
          >
            Reservar mi cita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
          <p className="font-display text-lg text-ink">
            AURA
          </p>
          <p className="text-xs text-stone">Un ritual de belleza y calma.</p>
          <div className="mt-2 flex gap-6 text-xs text-ink/50">
            <Link href="/professionals" className="hover:text-ink">Encontrar un profesional</Link>
            <Link href="/register" className="hover:text-ink">Únete como profesional</Link>
            <Link href="/login" className="hover:text-ink">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
