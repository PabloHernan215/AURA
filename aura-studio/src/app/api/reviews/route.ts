import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

export async function POST(req: Request) {
  try {
    const user = await requireRole('CLIENT');

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const { bookingId, rating, comment } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking || booking.clientId !== user.id) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Solo puedes reseñar citas completadas' }, { status: 400 });
    }
    if (booking.review) {
      return NextResponse.json({ error: 'Ya reseñaste esta cita' }, { status: 409 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { bookingId, rating, comment },
      });

      const [proAgg, businessAgg] = await Promise.all([
        tx.review.aggregate({
          where: { booking: { professionalId: booking.professionalId } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        tx.review.aggregate({
          where: { booking: { businessId: booking.businessId } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      await tx.professionalProfile.update({
        where: { id: booking.professionalId },
        data: {
          ratingAvg: Math.round((proAgg._avg.rating ?? rating) * 10) / 10,
          ratingCount: proAgg._count.rating,
        },
      });

      await tx.business.update({
        where: { id: booking.businessId },
        data: {
          ratingAvg: Math.round((businessAgg._avg.rating ?? rating) * 10) / 10,
          ratingCount: businessAgg._count.rating,
        },
      });

      return created;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
