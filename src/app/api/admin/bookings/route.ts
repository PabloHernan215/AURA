import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { getPlatformSettings } from '@/lib/settings';

export async function GET() {
  try {
    await requireRole('ADMIN');

    const settings = await getPlatformSettings();

    const bookings = await prisma.booking.findMany({
      include: {
        client: { select: { name: true, email: true } },
        professional: { include: { user: { select: { name: true } } } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { datetime: 'desc' },
      take: 200,
    });

    const lastViewed = settings.adminBookingsLastViewedAt;
    const bookingsWithNewFlag = bookings.map((b) => ({
      ...b,
      isNew: !lastViewed || b.createdAt > lastViewed,
    }));
    const newBookingsCount = bookingsWithNewFlag.filter((b) => b.isNew).length;

    const [totalUsers, totalProfessionals, totalBookings, completedBookings] = await Promise.all([
      prisma.user.count(),
      prisma.professionalProfile.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ]);

    const revenueAgg = await prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      include: { service: { select: { price: true } } },
    });
    const totalRevenue = revenueAgg.reduce((sum, b) => sum + b.service.price, 0);

    return NextResponse.json({
      bookings: bookingsWithNewFlag,
      newBookingsCount,
      metrics: {
        totalUsers,
        totalProfessionals,
        totalBookings,
        completedBookings,
        totalRevenue,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
