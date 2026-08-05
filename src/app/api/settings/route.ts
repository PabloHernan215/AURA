import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/settings';

// Same static-caching pitfall as the home page (see src/app/page.tsx) — without
// this, this route gets prerendered once at build time instead of reading live
// settings on every request.
export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getPlatformSettings();
  return NextResponse.json({ paymentMethods: settings.paymentMethods });
}
