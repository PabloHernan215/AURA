import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireRole('PROFESSIONAL');

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        business: { select: { id: true, name: true, isApproved: true, location: true } },
        services: { orderBy: { createdAt: 'asc' } },
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    // "New" = active bookings created since the professional last opened their bookings page.
    // If they've never visited it, everything they currently have counts as new.
    const newBookingsWhere = {
      professionalId: profile.id,
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(profile.lastBookingsViewedAt ? { createdAt: { gt: profile.lastBookingsViewedAt } } : {}),
    };

    const [newBookingsCount, newBookings] = await Promise.all([
      prisma.booking.count({ where: newBookingsWhere }),
      prisma.booking.findMany({
        where: newBookingsWhere,
        include: { client: { select: { name: true } }, service: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({ ...profile, newBookingsCount, newBookings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
