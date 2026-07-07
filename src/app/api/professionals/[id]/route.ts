import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { geocodeAddress } from '@/lib/geo';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const professional = await prisma.professionalProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, isActive: true } },
      services: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      availability: true,
      bookings: {
        where: { status: 'COMPLETED' },
        include: { review: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!professional || !professional.user.isActive || !professional.isApproved) {
    return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
  }

  const reviews = professional.bookings
    .filter((b) => b.review)
    .map((b) => ({ id: b.review!.id, rating: b.review!.rating, comment: b.review!.comment, createdAt: b.review!.createdAt }));

  return NextResponse.json({
    id: professional.id,
    name: professional.user.name,
    bio: professional.bio,
    specialties: professional.specialties,
    location: professional.location,
    latitude: professional.latitude,
    longitude: professional.longitude,
    photoUrl: professional.photoUrl,
    ratingAvg: professional.ratingAvg,
    ratingCount: professional.ratingCount,
    services: professional.services,
    availability: professional.availability,
    reviews,
  });
}

const updateSchema = z.object({
  bio: z.string().max(1000).optional(),
  specialties: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  whatsapp: z.string().max(30).optional(),
  // Accepts either a regular URL or a base64 data URI produced by the in-browser photo upload.
  photoUrl: z.string().max(2_000_000).optional().or(z.literal('')),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const profile = await prisma.professionalProfile.findUnique({ where: { id: params.id } });
    if (!profile) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (profile.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updateData: typeof parsed.data & { latitude?: number | null; longitude?: number | null } = {
      ...parsed.data,
    };

    // If the location text changed, silently re-geocode it in the background.
    // Best-effort: if the free geocoding service is unavailable, the profile still
    // saves fine — it just won't show a distance to clients until it succeeds.
    if (typeof parsed.data.location === 'string' && parsed.data.location !== profile.location) {
      const coords = await geocodeAddress(parsed.data.location);
      updateData.latitude = coords?.latitude ?? null;
      updateData.longitude = coords?.longitude ?? null;
    }

    const updated = await prisma.professionalProfile.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
