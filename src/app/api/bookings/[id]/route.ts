import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

const updateSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { professional: true },
    });
    if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });

    const isClientOwner = booking.clientId === user.id;
    const isProfessionalOwner = booking.professional.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClientOwner && !isProfessionalOwner && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { status } = parsed.data;

    // Business rules on who can set what
    if (status === 'CANCELLED' && !(isClientOwner || isProfessionalOwner || isAdmin)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    // Clients must cancel at least 2 hours ahead of the appointment. Professionals and
    // admins keep full flexibility to cancel any time, since they manage the schedule.
    if (status === 'CANCELLED' && isClientOwner && !isProfessionalOwner && !isAdmin) {
      const hoursUntilAppointment = (booking.datetime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilAppointment < 2) {
        return NextResponse.json(
          { error: 'Solo puedes cancelar con al menos 2 horas de anticipación. Contacta directamente al profesional.' },
          { status: 400 }
        );
      }
    }
    if (status === 'COMPLETED' && !(isProfessionalOwner || isAdmin)) {
      return NextResponse.json({ error: 'Solo el profesional puede marcar una reserva como completada' }, { status: 403 });
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Esta reserva ya no puede modificarse' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
