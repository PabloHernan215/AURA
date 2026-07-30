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

    // Bookings still awaiting the professional's confirmation — this drives the big
    // "nueva cita" banner on their dashboard, with an inline Confirmar button.
    const pendingBookings = await prisma.booking.findMany({
      where: { professionalId: profile.id, status: 'PENDING' },
      include: { client: { select: { name: true } }, service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ ...profile, pendingBookings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
