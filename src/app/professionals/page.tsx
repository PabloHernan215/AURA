import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfessionalsBrowser from './ProfessionalsBrowser';

export const metadata: Metadata = {
  title: 'Encuentra tu profesional',
  description:
    'Explora perfiles verificados de profesionales de belleza y bienestar cerca de ti, con disponibilidad real y reseñas de otros clientes.',
};

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalsBrowser />
    </Suspense>
  );
}
