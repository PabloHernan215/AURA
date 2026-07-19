// Valores compartidos entre metadata, sitemap.ts, robots.ts y los datos estructurados
// (JSON-LD), para no repetir la URL/base del sitio en cada archivo.
export const SITE_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'AURA';
export const SITE_DESCRIPTION =
  'Reserva profesionales de belleza y bienestar de confianza, en segundos. Un espacio sereno para cuidar de ti.';
