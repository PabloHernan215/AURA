import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/dashboard/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (path.startsWith('/dashboard/professional') && token?.role !== 'PROFESSIONAL') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (path.startsWith('/dashboard/business') && token?.role !== 'BUSINESS_OWNER') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
