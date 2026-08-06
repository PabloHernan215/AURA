'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ImageCarousel from '@/components/ImageCarousel';
import CountUp from '@/components/motion/CountUp';

const ROTATING_WORDS = ['Cabello', 'Uñas', 'Cejas y pestañas', 'Bienestar'];
const ROTATE_MS = 2200;

const BANNER_IMAGES = [
  { src: '/banner/banner-1.jpeg', alt: 'Descubre, reserva y disfruta con AURA' },
  { src: '/banner/banner-3.jpeg', alt: 'AURA Reservas — los mejores profesionales del cuidado personal cerca de ti' },
  { src: '/banner/banner-4.jpeg', alt: 'AURA — locales verificados con los mejores profesionales del cuidado personal' },
];

export default function HomeHero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % ROTATING_WORDS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch('/api/bookings/today-count')
      .then((res) => res.json())
      .then((data) => setTodayCount(typeof data.count === 'number' ? data.count : 0))
      .catch(() => setTodayCount(0));
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Floating "aura" glows — decorative, echoes the brand name. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-moss-300/25 blur-3xl animate-float" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-clay-300/20 blur-3xl animate-floatSlow" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-moss-100/40 blur-3xl animate-float" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-5 pt-10 sm:pt-14"
      >
        <ImageCarousel images={BANNER_IMAGES} />
      </motion.div>

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mb-3 mt-8 inline-block text-[11px] font-medium uppercase tracking-[0.15em] text-stone"
        >
          Cuidado personal, belleza y bienestar
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-moss-50 px-3.5 py-1.5 text-xs font-medium text-moss-600 shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-moss-500 animate-pulseSoft" />
          <span className="inline-flex items-center gap-1">
            Especialistas en
            <span className="relative inline-block min-w-[6.5ch] text-left">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_WORDS[wordIndex]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block font-semibold"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            cerca de ti
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-6 font-display text-4xl font-medium leading-[1.1] text-ink sm:text-6xl"
        >
          Reserva tus servicios de <span className="italic text-moss-500">cuidado personal.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-9"
        >
          <SearchBar />
        </motion.div>

        {todayCount !== null && todayCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-5 text-sm font-medium text-moss-600"
          >
            <CountUp value={todayCount} /> {todayCount === 1 ? 'cita reservada hoy' : 'citas reservadas hoy'}
          </motion.p>
        )}

        <motion.button
          type="button"
          title="Próximamente"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.48 }}
          className="btn-secondary mx-auto mt-6 inline-flex items-center gap-2 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h3M21 14v3" strokeLinecap="round" />
          </svg>
          Obtener la app
          <span className="text-xs text-ink/40">(Próximamente)</span>
        </motion.button>
      </div>
    </section>
  );
}
