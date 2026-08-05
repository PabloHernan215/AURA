import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

// GET /api/admin/business-changes -> recent professional business-switch events,
// for the admin to review and optionally notify either business owner about.
export async function GET() {
  try {
    await requireRole('ADMIN');

    const changes = await prisma.professionalBusinessChange.findMany({
      include: {
        professional: { select: { user: { select: { name: true } } } },
        oldBusiness: { select: { name: true, owner: { select: { name: true, whatsapp: true } } } },
        newBusiness: { select: { name: true, owner: { select: { name: true, whatsapp: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(changes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
