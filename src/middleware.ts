import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Rutas privadas o sin valor de SEO (no queremos que buscadores las indexen, aunque
// robots.ts ya les diga a los crawlers "no rastrear" — este header es la señal explícita
// de "no indexar" para cualquier URL que igual llegue a solicitarse).
function withNoIndex(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/dashboard/admin') && token?.role !== 'ADMIN') {
      return withNoIndex(NextResponse.redirect(new URL('/', req.url)));
    }
    if (path.startsWith('/dashboard/professional') && token?.role !== 'PROFESSIONAL') {
      return withNoIndex(NextResponse.redirect(new URL('/', req.url)));
    }
    return withNoIndex(NextResponse.next());
  },
  {
    callbacks: {
      // Estas rutas no requieren sesión para cargar (ej. /login, /register), pero sí
      // pasan por este middleware para recibir el header noindex; solo /dashboard/*
      // exige estar autenticado.
      authorized: ({ token, req }) => !!token || !req.nextUrl.pathname.startsWith('/dashboard'),
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/book/:path*', '/bookings'],
};
