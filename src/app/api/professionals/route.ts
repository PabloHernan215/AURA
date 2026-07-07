import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/professionals?specialty=Hair&q=maria
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');
  const q = searchParams.get('q');

  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isApproved: true,
      user: { isActive: true },
      ...(specialty ? { specialties: { contains: specialty } } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q } } },
              { specialties: { contains: q } },
              { bio: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      services: { where: { isActive: true }, orderBy: { price: 'asc' }, take: 3 },
    },
    orderBy: { ratingAvg: 'desc' },
  });

  return NextResponse.json(professionals);
}
