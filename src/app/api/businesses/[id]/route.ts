import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { geocodeAddress } from '@/lib/geo';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { isActive: true } },
      professionals: {
        include: {
          user: { select: { name: true } },
          services: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  if (!business || !business.owner.isActive || !business.isApproved) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    id: business.id,
    name: business.name,
    description: business.description,
    location: business.location,
    latitude: business.latitude,
    longitude: business.longitude,
    photoUrl: business.photoUrl,
    photos: business.photos,
    ratingAvg: business.ratingAvg,
    ratingCount: business.ratingCount,
    professionals: business.professionals.map((p) => ({
      id: p.id,
      name: p.user.name,
      bio: p.bio,
      specialties: p.specialties,
      photoUrl: p.photoUrl,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      services: p.services,
    })),
  });
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  whatsapp: z.string().max(30).optional(),
  photoUrl: z.string().max(2_000_000).optional().or(z.literal('')),
  photos: z.array(z.string().max(2_000_000)).max(5).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const business = await prisma.business.findUnique({ where: { id: params.id } });
    if (!business) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (business.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updateData: typeof parsed.data & { latitude?: number | null; longitude?: number | null } = {
      ...parsed.data,
    };

    if (typeof parsed.data.location === 'string' && parsed.data.location !== business.location) {
      const coords = await geocodeAddress(parsed.data.location);
      updateData.latitude = coords?.latitude ?? null;
      updateData.longitude = coords?.longitude ?? null;
    }

    const updated = await prisma.business.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
