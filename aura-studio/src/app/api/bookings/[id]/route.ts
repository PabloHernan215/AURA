import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { notifyClientOfConfirmedBooking } from '@/lib/whatsapp';
import { sendBookingConfirmedEmail } from '@/lib/email';
import { getPlatformSettings } from '@/lib/settings';

const updateSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        professional: { include: { user: { select: { name: true } } } },
        business: true,
        client: { select: { name: true, email: true, whatsapp: true } },
        service: { select: { name: true } },
      },
    });
    if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });

    const isClientOwner = booking.clientId === user.id;
    const isProfessionalOwner = booking.professional.userId === user.id;
    const isBusinessOwner = booking.business.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClientOwner && !isProfessionalOwner && !isBusinessOwner && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { status } = parsed.data;

    // Business rules on who can set what
    if (status === 'CONFIRMED' && !(isProfessionalOwner || isBusinessOwner || isAdmin)) {
      return NextResponse.json({ error: 'Solo el profesional o el local pueden confirmar una reserva' }, { status: 403 });
    }
    if (status === 'CANCELLED' && !(isClientOwner || isProfessionalOwner || isBusinessOwner || isAdmin)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    // Clients must cancel at least 2 hours ahead of the appointment. Professionals,
    // business owners, and admins keep full flexibility, since they manage the schedule.
    if (status === 'CANCELLED' && isClientOwner && !isProfessionalOwner && !isBusinessOwner && !isAdmin) {
      const hoursUntilAppointment = (booking.datetime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilAppointment < 2) {
        return NextResponse.json(
          { error: 'Solo puedes cancelar con al menos 2 horas de anticipación. Contacta directamente al profesional.' },
          { status: 400 }
        );
      }
    }
    if (status === 'COMPLETED' && !(isProfessionalOwner || isBusinessOwner || isAdmin)) {
      return NextResponse.json({ error: 'Solo el profesional o el local pueden marcar una reserva como completada' }, { status: 403 });
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Esta reserva ya no puede modificarse' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });

    // The moment a booking is confirmed, tell the client — by WhatsApp (from the one
    // centralized AURA number) and by email. Both are best-effort and never throw,
    // so a failure here can never undo or block the confirmation itself.
    if (status === 'CONFIRMED') {
      const settings = await getPlatformSettings();

      await notifyClientOfConfirmedBooking({
        clientWhatsapp: booking.client.whatsapp,
        clientName: booking.client.name,
        professionalName: booking.professional.user.name,
        serviceName: booking.service.name,
        datetime: booking.datetime,
        location: booking.business.location,
        paymentMethods: settings.paymentMethods,
      });

      await sendBookingConfirmedEmail({
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        professionalName: booking.professional.user.name,
        serviceName: booking.service.name,
        datetime: booking.datetime,
        location: booking.business.location,
        paymentMethods: settings.paymentMethods,
      });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
