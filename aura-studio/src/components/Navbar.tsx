'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref =
    session?.user.role === 'ADMIN'
      ? '/dashboard/admin'
      : session?.user.role === 'BUSINESS_OWNER'
      ? '/dashboard/business'
      : session?.user.role === 'PROFESSIONAL'
      ? '/dashboard/professional'
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-porcelain/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl text-ink">
          AURA
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/locales" className="text-sm text-ink/70 hover:text-ink">
            Buscar local
          </Link>
          {session?.user.role === 'CLIENT' && (
            <Link href="/bookings" className="text-sm text-ink/70 hover:text-ink">
              Mis citas
            </Link>
          )}
          {dashboardHref && (
            <Link href={dashboardHref} className="text-sm text-ink/70 hover:text-ink">
              Panel
            </Link>
          )}
          {status === 'authenticated' ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink/50">{session.user.name}</span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary py-2">
                Cerrar sesión
              </button>
            </div>
          ) : status === 'unauthenticated' ? (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-primary py-2">
                Comenzar
              </Link>
            </div>
          ) : null}
        </nav>

        <button
          className="md:hidden text-ink"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink/8 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/locales" onClick={() => setMenuOpen(false)} className="text-sm font-medium">
              Buscar local
            </Link>
            {session?.user.role === 'CLIENT' && (
              <Link href="/bookings" onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                Mis citas
              </Link>
            )}
            {dashboardHref && (
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                Panel
              </Link>
            )}
            {status === 'authenticated' ? (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-left text-sm font-medium text-moss-600"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                  Iniciar sesión
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-moss-600">
                  Comenzar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
