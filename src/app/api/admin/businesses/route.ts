import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { notifyBusinessApproved } from '@/lib/whatsapp';

// GET /api/admin/businesses -> every business, for the admin review queue
export async function GET() {
  try {
    await requireRole('ADMIN');

    const businesses = await prisma.business.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
        professionals: { select: { id: true } },
      },
      orderBy: [{ isApproved: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(businesses);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

const approveSchema = z.object({
  businessId: z.string(),
  isApproved: z.boolean(),
});

// PATCH /api/admin/businesses -> approve or revoke a business's public visibility
export async function PATCH(req: Request) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const before = await prisma.business.findUnique({
      where: { id: parsed.data.businessId },
      select: { isApproved: true, name: true, owner: { select: { name: true, whatsapp: true } } },
    });

    const updated = await prisma.business.update({
      where: { id: parsed.data.businessId },
      data: { isApproved: parsed.data.isApproved },
    });

    // Best-effort notification — never blocks the approval response if it fails.
    if (parsed.data.isApproved && before && !before.isApproved) {
      notifyBusinessApproved({
        ownerWhatsapp: before.owner.whatsapp,
        ownerName: before.owner.name,
        businessName: before.name,
      }).catch(() => {});
    }

    return NextResponse.json({ id: updated.id, isApproved: updated.isApproved });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
