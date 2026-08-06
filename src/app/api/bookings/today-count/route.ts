import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bookings/today-count -> public, single number for the hero's
// "X citas reservadas hoy" counter. No booking details are exposed.
export const dynamic = 'force-dynamic';

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.booking.count({ where: { createdAt: { gte: startOfDay } } });
  return NextResponse.json({ count });
}
