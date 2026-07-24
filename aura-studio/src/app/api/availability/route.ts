import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { getAvailableSlots } from '@/lib/availability';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const windowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Usa el formato HH:mm'),
  endTime: z.string().regex(timeRegex, 'Usa el formato HH:mm'),
});

/**
 * GET /api/availability?professionalId=xyz            -> weekly windows (schedule editor)
 * GET /api/availability?professionalId=xyz&date=2026-07-05&serviceId=abc -> bookable slots for a day
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const professionalId = searchParams.get('professionalId');
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');

  if (!professionalId) {
    return NextResponse.json({ error: 'professionalId es requerido' }, { status: 400 });
  }

  if (date && serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

    const targetDate = new Date(`${date}T00:00:00`);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    }

    const slots = await getAvailableSlots(professionalId, targetDate, service.duration);
    return NextResponse.json({ slots });
  }

  const windows = await prisma.availability.findMany({
    where: { professionalId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  return NextResponse.json(windows);
}

export async function POST(req: Request) {
  try {
    const user = await requireRole('PROFESSIONAL');
    const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ error: 'Completa primero tu perfil de profesional' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = windowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    if (parsed.data.startTime >= parsed.data.endTime) {
      return NextResponse.json({ error: 'La hora de inicio debe ser antes de la hora de fin' }, { status: 400 });
    }

    const window = await prisma.availability.create({
      data: { ...parsed.data, professionalId: profile.id },
    });

    return NextResponse.json(window, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireRole('PROFESSIONAL');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 });

    const window = await prisma.availability.findUnique({ where: { id }, include: { professional: true } });
    if (!window) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (window.professional.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.availability.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
