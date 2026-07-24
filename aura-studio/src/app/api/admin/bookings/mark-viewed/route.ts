import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { markAdminBookingsViewed } from '@/lib/settings';

export async function POST() {
  try {
    await requireRole('ADMIN');
    await markAdminBookingsViewed();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
