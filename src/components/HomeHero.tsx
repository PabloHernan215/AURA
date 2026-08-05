'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSearch from '@/components/HeroSearch';

const ROTATING_WORDS = ['Cabello', 'Uñas', 'Cejas y pestañas', 'Bienestar'];
const ROTATE_MS = 2200;

export default function HomeHero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % ROTATING_WORDS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Floating "aura" glows — decorative, echoes the brand name. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-moss-300/25 blur-3xl animate-float" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-clay-300/20 blur-3xl animate-floatSlow" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-moss-100/40 blur-3xl animate-float" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.15em] text-stone"
            >
              Cuidado personal, belleza y bienestar
            </motion.span>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-moss-50 px-3.5 py-1.5 text-xs font-medium text-moss-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-moss-500 animate-pulseSoft" />
              <span className="inline-flex items-center gap-1">
                Especialistas en
                <span className="relative inline-block min-w-[6.5ch] text-left">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[wordIndex]}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
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
              className="font-display text-[2.75rem] font-medium leading-[1.1] text-ink sm:text-6xl"
            >
              Un momento
              <br />
              para ti,
              <br />
              <span className="italic text-moss-500">reservado en segundos.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-6 max-w-md text-base leading-relaxed text-ink/60"
            >
              AURA te conecta con especialistas en cabello, uñas y bienestar de confianza.
              Sin llamadas, sin esperas — solo tú, eligiendo el momento perfecto para cuidarte.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-9 flex flex-wrap items-center gap-5"
            >
              <Link href="/locales" className="btn-primary animate-ctaGlow">
                Reservar mi cita
              </Link>
              <Link
                href="/register?role=PROFESSIONAL"
                className="text-sm font-medium text-ink/60 underline decoration-stone-light underline-offset-4 hover:text-ink"
              >
                Soy profesional
              </Link>
              <Link
                href="/register?role=BUSINESS_OWNER"
                className="text-sm font-medium text-ink/60 underline decoration-stone-light underline-offset-4 hover:text-ink"
              >
                Registrar un local
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-5 text-xs text-stone"
            >
              Reserva en menos de un minuto · Sin registros complicados · Cancela cuando quieras
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <HeroSearch />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
