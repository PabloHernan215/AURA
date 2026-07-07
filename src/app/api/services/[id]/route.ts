import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().min(5).max(600).optional(),
  photoUrl: z.string().max(2_000_000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

async function assertOwnership(serviceId: string, userId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: true },
  });
  if (!service) {
    const err = new Error('Servicio no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (service.professional.userId !== userId) {
    const err = new Error('No autorizado') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return service;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('PROFESSIONAL');
    await assertOwnership(params.id, user.id);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await prisma.service.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

// Soft-delete: mark inactive instead of hard delete, to preserve booking history integrity
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole('PROFESSIONAL');
    await assertOwnership(params.id, user.id);

    await prisma.service.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
