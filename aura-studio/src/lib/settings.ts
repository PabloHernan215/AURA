import { prisma } from '@/lib/prisma';

const SETTINGS_ID = 'settings';

export async function getPlatformSettings() {
  const existing = await prisma.platformSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;

  return prisma.platformSettings.create({
    data: { id: SETTINGS_ID },
  });
}

export async function updatePaymentMethods(paymentMethods: string) {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { paymentMethods },
    create: { id: SETTINGS_ID, paymentMethods },
  });
}

export async function markAdminBookingsViewed() {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { adminBookingsLastViewedAt: new Date() },
    create: { id: SETTINGS_ID, adminBookingsLastViewedAt: new Date() },
  });
}
