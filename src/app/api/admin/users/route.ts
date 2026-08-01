import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function GET() {
  try {
    await requireRole('ADMIN');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        role: true,
        isActive: true,
        createdAt: true,
        professionalProfile: {
          select: { id: true, bio: true, specialties: true, whatsapp: true, photoUrl: true, ratingAvg: true, ratingCount: true },
        },
        ownedBusiness: {
          select: { id: true, name: true, description: true, location: true, whatsapp: true, photoUrl: true, isApproved: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

const toggleSchema = z.object({
  userId: z.string(),
  isActive: z.boolean(),
});

export async function PATCH(req: Request) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { isActive: parsed.data.isActive },
    });

    return NextResponse.json({ id: updated.id, isActive: updated.isActive });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
