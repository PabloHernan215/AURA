import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser } from '@/lib/session';
import { isSlotStillAvailable } from '@/lib/availability';
import { notifyProfessionalOfNewBooking } from '@/lib/whatsapp';
import { sendBookingEmails } from '@/lib/email';
import { getPlatformSettings } from '@/lib/settings';

const bookingSchema = z.object({
  professionalId: z.string(),
  serviceId: z.string(),
  datetime: z.string().datetime().or(z.string()), // ISO string
  notes: z.string().max(500).optional(),
});

// GET /api/bookings -> bookings for the logged-in user (client sees their own, professional sees theirs)
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    if (user.role === 'PROFESSIONAL') {
      const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
      if (!profile) return NextResponse.json([]);

      const bookings = await prisma.booking.findMany({
        where: { professionalId: profile.id, ...(status ? { status: status as any } : {}) },
        include: { client: { select: { name: true, email: true, whatsapp: true } }, service: true },
        orderBy: { datetime: 'asc' },
      });
      return NextResponse.json(bookings);
    }

    // CLIENT (and ADMIN falls back to their own, empty, list — admin uses /api/admin/bookings)
    const bookings = await prisma.booking.findMany({
      where: { clientId: user.id, ...(status ? { status: status as any } : {}) },
      include: {
        service: true,
        professional: { include: { user: { select: { name: true } } } },
        review: true,
      },
      orderBy: { datetime: 'desc' },
    });
    return NextResponse.json(bookings);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

// POST /api/bookings -> create a booking (client only)
export async function POST(req: Request) {
  try {
    const user = await requireRole('CLIENT');

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { professionalId, serviceId, notes } = parsed.data;
    const requestedStart = new Date(parsed.data.datetime);
    if (isNaN(requestedStart.getTime())) {
      return NextResponse.json({ error: 'Fecha u hora inválida' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { professional: { select: { isApproved: true } } },
    });
    if (!service || service.professionalId !== professionalId || !service.isActive) {
      return NextResponse.json({ error: 'Servicio no encontrado para este profesional' }, { status: 404 });
    }
    if (!service.professional.isApproved) {
      return NextResponse.json({ error: 'Este profesional aún no está disponible para reservas' }, { status: 403 });
    }

    // Re-check availability server-side right before writing (closes the race window)
    const stillFree = await isSlotStillAvailable(professionalId, requestedStart, service.duration);
    if (!stillFree) {
      return NextResponse.json(
        { error: 'Este horario ya no está disponible. Por favor elige otro.' },
        { status: 409 }
      );
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          clientId: user.id,
          professionalId,
          serviceId,
          datetime: requestedStart,
          durationMin: service.duration,
          notes,
          status: 'CONFIRMED',
        },
        include: {
          service: true,
          client: { select: { name: true, email: true, whatsapp: true } },
          professional: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      // Best-effort WhatsApp notification to the professional only — this helper never
      // throws, so it can never fail or slow down the booking, which is already saved.
      await notifyProfessionalOfNewBooking({
        professionalWhatsapp: booking.professional.whatsapp,
        professionalName: booking.professional.user.name,
        clientName: booking.client.name,
        clientWhatsapp: booking.client.whatsapp,
        serviceName: booking.service.name,
        datetime: booking.datetime,
        location: booking.professional.location,
      });

      // Best-effort email confirmation to the client, the professional, and every admin —
      // this helper never throws either, so it can never fail or slow down the booking.
      const [settings, admins] = await Promise.all([
        getPlatformSettings(),
        prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } }),
      ]);

      await sendBookingEmails(
        {
          clientName: booking.client.name,
          clientEmail: booking.client.email,
          professionalName: booking.professional.user.name,
          professionalEmail: booking.professional.user.email,
          serviceName: booking.service.name,
          datetime: booking.datetime,
          location: booking.professional.location,
          paymentMethods: settings.paymentMethods,
        },
        admins.map((a) => a.email)
      );

      return NextResponse.json(booking, { status: 201 });
    } catch (dbError) {
      // Unique constraint on (professionalId, datetime) is the final safety net
      // against a simultaneous double-booking race condition.
      if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Este horario acaba de ser reservado por alguien más. Por favor elige otro.' },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
