import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const professionals = await prisma.professionalProfile.findMany({
    where: { isApproved: true, user: { isActive: true } },
    select: { id: true, updatedAt: true },
  });

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/professionals`, changeFrequency: 'daily', priority: 0.9 },
    ...professionals.map((p) => ({
      url: `${SITE_URL}/professionals/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
