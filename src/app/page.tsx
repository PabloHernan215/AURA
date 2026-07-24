import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BusinessCard from '@/components/BusinessCard';
import HeroSearch from '@/components/HeroSearch';

const CATEGORIES = [
  {
    name: 'Cabello',
    description: 'Cortes, color y peinado',
    href: '/locales?specialty=Cabello',
    icon: (
      <path d="M12 3c-3 0-5.5 2.2-5.5 5.5 0 1.8.9 3 1.8 4.2.8 1 1.5 1.9 1.5 3.3v3l2.2-1.7 2.2 1.7v-3c0-1.4.7-2.3 1.5-3.3.9-1.2 1.8-2.4 1.8-4.2C17.5 5.2 15 3 12 3z" />
    ),
  },
  {
    name: 'Uñas',
    description: 'Manicure y pedicure',
    href: '/locales?specialty=Uñas',
    icon: (
      <path d="M8 21s-1-4.5-1-8a5 5 0 0110 0c0 3.5-1 8-1 8M9 12V7a1.5 1.5 0 013 0v5M12 12V6a1.5 1.5 0 013 0v6" />
    ),
  },
  {
    name: 'Bienestar',
    description: 'Faciales y relajación',
    href: '/locales?specialty=Bienestar',
    icon: (
      <path d="M12 21c-4.5-2.5-8-6-8-10.5A5.5 5.5 0 0112 6a5.5 5.5 0 018 4.5c0 4.5-3.5 8-8 10.5z" />
    ),
  },
];

const VALUE_PROPS = [
  {
    title: 'Locales verificados',
    body: 'Cada local es revisado antes de aparecer en la plataforma.',
    icon: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  },
  {
    title: 'Disponibilidad real',
    body: 'Ves los horarios libres de verdad, actualizados al instante.',
    icon: <path d="M12 7v5l3.5 2M12 21a9 9 0 100-18 9 9 0 000 18z" />,
  },
  {
    title: 'Sin sorpresas',
    body: 'Precio y forma de pago claros antes de confirmar tu cita.',
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    title: 'A tu ritmo',
    body: 'Reserva, reprograma o cancela cuando lo necesites.',
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
  const featuredBusinesses = await prisma.business.findMany({
    where: { isApproved: true, owner: { isActive: true } },
    include: { professionals: { select: { specialties: true, services: { select: { price: true }, where: { isActive: true } } } } },
    orderBy: { ratingAvg: 'desc' },
    take: 3,
  });

  const featured = featuredBusinesses.map((b) => {
    const allPrices = b.professionals.flatMap((p) => p.services.map((s) => s.price));
    const specialties = Array.from(
      new Set(b.professionals.flatMap((p) => p.specialties.split(',').map((s) => s.trim()).filter(Boolean)))
    ).join(',');
    return {
      id: b.id,
      name: b.name,
      photoUrl: b.photoUrl,
      specialties,
      location: b.location,
      ratingAvg: b.ratingAvg,
      ratingCount: b.ratingCount,
      startingPrice: allPrices.length ? Math.min(...allPrices) : null,
    };
  });

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.15em] text-stone">
              Cuidado personal, belleza y bienestar
            </span>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-moss-50 px-3.5 py-1.5 text-xs font-medium text-moss-600">
              <span className="h-1.5 w-1.5 rounded-full bg-moss-500 animate-pulseSoft" />
              Profesionales disponibles cerca de ti
            </div>
            <h1 className="font-display text-[2.75rem] font-medium leading-[1.1] text-ink sm:text-6xl">
              Un momento
              <br />
              para ti,
              <br />
              <span className="italic text-moss-500">reservado en segundos.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60">
              AURA te conecta con especialistas en cabello, uñas y bienestar de confianza.
              Sin llamadas, sin esperas — solo tú, eligiendo el momento perfecto para cuidarte.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/locales" className="btn-primary">
                Reservar mi cita
              </Link>
              <Link href="/register" className="text-sm font-medium text-ink/60 underline decoration-stone-light underline-offset-4 hover:text-ink">
                Soy profesional
              </Link>
            </div>
            <p className="mt-5 text-xs text-stone">
              Reserva en menos de un minuto · Sin registros complicados · Cancela cuando quieras
            </p>
          </div>

          <div className="relative">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Categorías de servicio */}
      <section className="border-y border-ink/8 bg-white/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex items-center gap-4 rounded-xl border border-ink/8 bg-white px-6 py-5 transition-colors hover:border-moss-300"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-50 text-moss-600">
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
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-stone">Por qué AURA</span>
          <h2 className="mt-3 font-display text-3xl font-medium text-ink">
            Cuidado profesional, con la tranquilidad de saber qué esperar.
          </h2>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink/70">
                <Icon>{v.icon}</Icon>
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-ink/8 bg-white/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-stone">Cómo funciona</span>
          <h2 className="mt-3 font-display text-3xl font-medium text-ink">Tres pasos, sin complicaciones.</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              { title: 'Elige tu local', body: 'Explora locales verificados, sus profesionales, trabajos y reseñas reales de otros clientes.' },
              { title: 'Elige un horario real', body: 'Ves exactamente cuándo están disponibles — la agenda se actualiza en vivo.' },
              { title: 'Confirma y listo', body: 'Tu cita queda guardada al instante, con dirección y forma de pago claras.' },
            ].map((step, i) => (
              <div key={step.title} className="relative pl-10">
                <span className="absolute left-0 top-0 font-display text-2xl text-moss-300">0{i + 1}</span>
                <h3 className="font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prueba social */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-3 divide-x divide-ink/8 rounded-xl border border-ink/8 bg-white py-8 text-center">
          <div>
            <p className="font-display text-3xl text-ink">+500</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-stone">Citas confirmadas</p>
          </div>
          <div>
            <p className="font-display text-3xl text-ink">4.9</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-stone">Calificación promedio</p>
          </div>
          <div>
            <p className="font-display text-3xl text-ink">100%</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-stone">Locales verificados</p>
          </div>
        </div>
      </section>

      {/* Locales destacados */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-stone">Esta semana</span>
              <h2 className="mt-2 font-display text-3xl font-medium text-ink">Los mejor calificados</h2>
            </div>
            <Link href="/locales" className="text-sm font-medium text-moss-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => (
              <BusinessCard
                key={b.id}
                id={b.id}
                name={b.name}
                photoUrl={b.photoUrl}
                specialties={b.specialties}
                location={b.location}
                ratingAvg={b.ratingAvg}
                ratingCount={b.ratingCount}
                startingPrice={b.startingPrice}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="bg-ink py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
            Regálate un momento de calma.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Encuentra a tu profesional ideal y reserva en menos de un minuto.
          </p>
          <Link href="/locales" className="btn-primary mt-8 inline-flex bg-white text-ink hover:bg-white/90">
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
            <Link href="/locales" className="hover:text-ink">Encontrar un local</Link>
            <Link href="/register" className="hover:text-ink">Registra tu local</Link>
            <Link href="/login" className="hover:text-ink">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
