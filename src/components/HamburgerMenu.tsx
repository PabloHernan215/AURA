'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function HamburgerMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardHref =
    session?.user.role === 'ADMIN'
      ? '/dashboard/admin'
      : session?.user.role === 'BUSINESS_OWNER'
      ? '/dashboard/business'
      : session?.user.role === 'PROFESSIONAL'
      ? '/dashboard/professional'
      : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="btn-secondary flex items-center gap-1 whitespace-nowrap px-2.5 py-1 text-[11px] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
        Menú
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-ink/8 bg-white p-2 shadow-lg">
          <Link
            href="/locales"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-sand"
          >
            Buscar local
          </Link>
          {session?.user.role === 'CLIENT' && (
            <Link
              href="/bookings"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-sand"
            >
              Mis citas
            </Link>
          )}
          {dashboardHref && (
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-sand"
            >
              Panel
            </Link>
          )}

          <div className="my-1 border-t border-ink/8" />

          {status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-moss-600 hover:bg-sand"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-moss-600 hover:bg-sand"
            >
              Crear cuenta
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
