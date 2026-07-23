import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function POST() {
  try {
    const user = await requireRole('BUSINESS_OWNER');

    const business = await prisma.business.findUnique({ where: { ownerId: user.id } });
    if (!business) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { lastBookingsViewedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
