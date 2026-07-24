import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/businesses?specialty=Cabello&q=aura
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');
  const q = searchParams.get('q');

  const businesses = await prisma.business.findMany({
    where: {
      isApproved: true,
      owner: { isActive: true },
      ...(specialty
        ? { professionals: { some: { specialties: { contains: specialty } } } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { professionals: { some: { specialties: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: {
      professionals: {
        select: { specialties: true },
      },
      _count: { select: { professionals: true } },
    },
    orderBy: { ratingAvg: 'desc' },
  });

  // Aggregate a starting price (cheapest active service across all professionals) and
  // a combined specialties list, so the browse card can show something useful at a glance.
  const businessIds = businesses.map((b) => b.id);
  const cheapestServices = businessIds.length
    ? await prisma.service.findMany({
        where: { isActive: true, professional: { businessId: { in: businessIds } } },
        select: { price: true, professional: { select: { businessId: true } } },
        orderBy: { price: 'asc' },
      })
    : [];

  const startingPriceByBusiness = new Map<string, number>();
  for (const s of cheapestServices) {
    const id = s.professional.businessId;
    if (!startingPriceByBusiness.has(id)) startingPriceByBusiness.set(id, s.price);
  }

  const result = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    location: b.location,
    latitude: b.latitude,
    longitude: b.longitude,
    photoUrl: b.photoUrl,
    ratingAvg: b.ratingAvg,
    ratingCount: b.ratingCount,
    professionalCount: b._count.professionals,
    specialties: Array.from(
      new Set(
        b.professionals
          .flatMap((p) => p.specialties.split(','))
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).join(','),
    startingPrice: startingPriceByBusiness.get(b.id) ?? null,
  }));

  return NextResponse.json(result);
}
