'use client';

import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* Makes every Framer Motion animation in the app respect the OS-level
          prefers-reduced-motion setting — the CSS media query in globals.css
          only covers plain CSS animations/transitions, not Framer Motion's. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SessionProvider>
  );
}
