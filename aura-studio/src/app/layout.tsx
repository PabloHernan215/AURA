import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, IBM_Plex_Mono } from 'next/font/google';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import './globals.css';

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'AURA — Un ritual de belleza y calma',
  description: 'Reserva profesionales de belleza y bienestar de confianza, en segundos. Un espacio sereno para cuidar de ti.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
