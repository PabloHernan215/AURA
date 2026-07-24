import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional().default(''),
  price: z.number().positive('El precio debe ser mayor a 0'),
  duration: z.number().int().min(5, 'La duración mínima es 5 minutos').max(600),
  photoUrl: z.string().max(2_000_000).optional().or(z.literal('')),
});

// GET /api/services?professionalId=xyz
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const professionalId = searchParams.get('professionalId');

  if (!professionalId) {
    return NextResponse.json({ error: 'professionalId es requerido' }, { status: 400 });
  }

  const services = await prisma.service.findMany({
    where: { professionalId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(services);
}

export async function POST(req: Request) {
  try {
    const user = await requireRole('PROFESSIONAL');

    const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ error: 'Completa primero tu perfil de profesional' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { ...parsed.data, professionalId: profile.id },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
