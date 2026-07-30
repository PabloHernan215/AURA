import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireRole('BUSINESS_OWNER');

    const business = await prisma.business.findUnique({
      where: { ownerId: user.id },
      include: {
        professionals: {
          include: {
            user: { select: { name: true, email: true, isActive: true } },
            services: { select: { id: true } },
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    // Bookings still awaiting confirmation — drives the big "nueva cita" banner on
    // the owner's dashboard, with an inline Confirmar button.
    const pendingBookings = await prisma.booking.findMany({
      where: { businessId: business.id, status: 'PENDING' },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ ...business, pendingBookings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
