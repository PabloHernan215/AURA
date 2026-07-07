import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export async function POST() {
  try {
    const user = await requireRole('PROFESSIONAL');

    const profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { lastBookingsViewedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
