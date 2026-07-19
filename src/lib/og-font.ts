// Next.js 14.2.x en Windows tiene un bug conocido: ImageResponse (next/og) intenta
// autocargar su fuente por defecto (Noto Sans) desde node_modules y construye una URL
// de archivo inválida (mezcla rutas de Windows con file://), tumbando la respuesta con
// "failed to pipe response". Cargar explícitamente nuestra propia fuente evita esa ruta
// de código por completo. El User-Agent antiguo es el truco estándar para que Google
// Fonts devuelva TTF/OTF en vez de WOFF2 (Satori, el motor detrás de ImageResponse, no
// soporta WOFF2).
const LEGACY_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.100 Safari/534.30';

export async function getInterFont(weight: 400 | 500 | 600 | 700 = 600, text?: string): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ family: `Inter:wght@${weight}`, ...(text ? { text } : {}) });
  const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
    headers: { 'User-Agent': LEGACY_USER_AGENT },
  }).then((res) => res.text());

  const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/)?.[1];
  if (!fontUrl) throw new Error('No se pudo resolver la URL de la fuente de Google Fonts');

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}
