import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION } from '@/lib/site';
import { getInterFont } from '@/lib/og-font';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const interSemibold = await getInterFont(600);

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 32,
            fontWeight: 600,
            color: '#2B2723',
            letterSpacing: 4,
          }}
        >
          AURA
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 60,
            fontWeight: 600,
            color: '#2B2723',
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Un momento para ti, reservado en segundos.
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 28, color: '#96897A', maxWidth: 820 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: interSemibold, style: 'normal', weight: 600 }] }
  );
}
