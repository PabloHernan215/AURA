'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const OPTIONS = [
  { label: 'Profesional', value: 'professional' },
  { label: 'Cliente', value: 'client' },
  { label: 'Dueño de negocio', value: 'business' },
];

export default function LoginDropdown() {
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

  if (status === 'authenticated' && session) {
    return (
      <span className="whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-white sm:px-4 sm:py-1.5 sm:text-xs">
        {session.user.name}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-ink/85 sm:px-4 sm:py-1.5 sm:text-xs"
      >
        Iniciar sesión
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-ink/8 bg-white p-2 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-stone">
            Elige tu tipo de cuenta
          </p>
          {OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/login?as=${opt.value}`}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-sand"
            >
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
