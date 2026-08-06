'use client';

import Link from 'next/link';
import LoginDropdown from './LoginDropdown';
import HamburgerMenu from './HamburgerMenu';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-porcelain/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl text-ink">
          AURA
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <LoginDropdown />
          <Link href="/register?role=BUSINESS_OWNER" className="btn-secondary py-2 text-sm">
            Registra tu negocio
          </Link>
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
