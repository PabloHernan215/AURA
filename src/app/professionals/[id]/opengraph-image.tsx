import { ImageResponse } from 'next/og';
import { SITE_URL } from '@/lib/site';
import { getInterFont } from '@/lib/og-font';

// runtime: 'edge' evita un bug conocido de Next.js 14.2.x en Windows donde la variante
// Node.js de ImageResponse intenta autocargar su fuente por defecto con una URL de
// archivo inválida. Por eso esta ruta consume la API pública en vez de Prisma
// directamente (Prisma no corre en el runtime edge sin un driver adapter).
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface ProfessionalSummary {
  name: string;
  specialties: string;
  ratingAvg: number;
  ratingCount: number;
}

export default async function OpengraphImage({ params }: { params: { id: string } }) {
  const [professional, interSemibold] = await Promise.all([
    fetch(`${SITE_URL}/api/professionals/${params.id}`)
      .then((res) => (res.ok ? (res.json() as Promise<ProfessionalSummary>) : null))
      .catch(() => null),
    getInterFont(600),
  ]);

  const name = professional?.name ?? 'AURA';
  const tags = (professional?.specialties ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');
  const rating = professional && professional.ratingCount > 0 ? professional.ratingAvg.toFixed(1) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: '#FAF7F1',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, color: '#96897A', letterSpacing: 4 }}>AURA</div>
        <div style={{ display: 'flex', marginTop: 32, fontSize: 72, fontWeight: 600, color: '#2B2723' }}>{name}</div>
        {tags && <div style={{ display: 'flex', marginTop: 20, fontSize: 32, color: '#5F6B4C' }}>{tags}</div>}
        {rating && (
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#A67C4D' }}>
            {rating} de calificación · {professional!.ratingCount} reseñas
          </div>
        )}
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: interSemibold, style: 'normal', weight: 600 }] }
  );
}
