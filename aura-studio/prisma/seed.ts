import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@aura.studio' },
    update: { password, role: 'ADMIN', isActive: true },
    create: {
      name: 'Admin AURA',
      email: 'admin@aura.studio',
      password,
      role: 'ADMIN',
    },
  });

  // Cliente
  await prisma.user.upsert({
    where: { email: 'client@aura.studio' },
    update: { password, role: 'CLIENT', isActive: true, whatsapp: '+52 55 1111 2222' },
    create: {
      name: 'Sofía Ramírez',
      email: 'client@aura.studio',
      password,
      role: 'CLIENT',
      whatsapp: '+52 55 1111 2222',
    },
  });

  // ---------- Local #1: AURA Hub - Centro (Cabello) ----------
  const owner1 = await prisma.user.upsert({
    where: { email: 'dueno1@aura.studio' },
    update: { password, role: 'BUSINESS_OWNER', isActive: true },
    create: {
      name: 'Carlos Medina',
      email: 'dueno1@aura.studio',
      password,
      role: 'BUSINESS_OWNER',
      whatsapp: '+52 55 3333 4444',
    },
  });

  const business1 = await prisma.business.upsert({
    where: { ownerId: owner1.id },
    update: { isApproved: true },
    create: {
      ownerId: owner1.id,
      name: 'AURA Hub - Centro',
      description: 'Un salón íntimo en el corazón de la ciudad, especializado en cabello y color.',
      location: 'AURA Hub - Centro',
      latitude: 19.4326,
      longitude: -99.1332,
      whatsapp: '+52 55 3333 4444',
      photoUrl: 'https://picsum.photos/seed/aura-hub-centro/800/600',
      isApproved: true,
      ratingAvg: 4.8,
      ratingCount: 42,
    },
  });

  const mariaUser = await prisma.user.upsert({
    where: { email: 'maria@aura.studio' },
    update: { password, role: 'PROFESSIONAL', isActive: true },
    create: {
      name: 'María González',
      email: 'maria@aura.studio',
      password,
      role: 'PROFESSIONAL',
    },
  });

  const mariaProfile = await prisma.professionalProfile.upsert({
    where: { userId: mariaUser.id },
    update: { businessId: business1.id },
    create: {
      userId: mariaUser.id,
      businessId: business1.id,
      bio: 'Colorista y estilista con 8 años de experiencia. Especialista en balayage y cortes de precisión.',
      specialties: 'Cabello,Color,Balayage',
      whatsapp: '+52 55 1234 5678',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria-Gonzalez',
      ratingAvg: 4.8,
      ratingCount: 42,
    },
  });

  await prisma.service.createMany({
    data: [
      { professionalId: mariaProfile.id, name: 'Corte Signature', description: 'Lavado, corte y estilizado a tu medida.', price: 45, duration: 45, photoUrl: 'https://picsum.photos/seed/corte-signature/600/600' },
      { professionalId: mariaProfile.id, name: 'Balayage Completo', description: 'Color pintado a mano para un efecto natural de sol.', price: 150, duration: 150, photoUrl: 'https://picsum.photos/seed/balayage-completo/600/600' },
      { professionalId: mariaProfile.id, name: 'Brushing', description: 'Lavado y secado profesional con acabado perfecto.', price: 30, duration: 30, photoUrl: 'https://picsum.photos/seed/brushing-look/600/600' },
    ],
    skipDuplicates: true,
  });

  await prisma.availability.createMany({
    data: [
      { professionalId: mariaProfile.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { professionalId: mariaProfile.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { professionalId: mariaProfile.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { professionalId: mariaProfile.id, dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
    skipDuplicates: true,
  });

  // ---------- Local #2: AURA Nails Studio (Uñas / Bienestar) ----------
  const owner2 = await prisma.user.upsert({
    where: { email: 'dueno2@aura.studio' },
    update: { password, role: 'BUSINESS_OWNER', isActive: true },
    create: {
      name: 'Valentina Rojas',
      email: 'dueno2@aura.studio',
      password,
      role: 'BUSINESS_OWNER',
      whatsapp: '+52 55 5555 6666',
    },
  });

  const business2 = await prisma.business.upsert({
    where: { ownerId: owner2.id },
    update: { isApproved: true },
    create: {
      ownerId: owner2.id,
      name: 'AURA Nails Studio',
      description: 'Estudio boutique de manicure, pedicure y bienestar, pensado para relajarte.',
      location: 'AURA Nails Studio - Roma Norte',
      latitude: 19.4194,
      longitude: -99.1642,
      whatsapp: '+52 55 5555 6666',
      photoUrl: 'https://picsum.photos/seed/aura-nails-studio/800/600',
      isApproved: true,
      ratingAvg: 4.9,
      ratingCount: 67,
    },
  });

  const luciaUser = await prisma.user.upsert({
    where: { email: 'lucia@aura.studio' },
    update: { password, role: 'PROFESSIONAL', isActive: true },
    create: {
      name: 'Lucía Fernández',
      email: 'lucia@aura.studio',
      password,
      role: 'PROFESSIONAL',
    },
  });

  const luciaProfile = await prisma.professionalProfile.upsert({
    where: { userId: luciaUser.id },
    update: { businessId: business2.id },
    create: {
      userId: luciaUser.id,
      businessId: business2.id,
      bio: 'Nail artist enfocada en trabajo en gel duradero y diseños pintados a mano.',
      specialties: 'Uñas,Gel,Bienestar',
      whatsapp: '+52 55 8765 4321',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia-Fernandez',
      ratingAvg: 4.9,
      ratingCount: 67,
    },
  });

  await prisma.service.createMany({
    data: [
      { professionalId: luciaProfile.id, name: 'Manicure en Gel', description: 'Esmaltado en gel de larga duración, incluye cuidado de cutículas.', price: 35, duration: 45, photoUrl: 'https://picsum.photos/seed/manicure-gel/600/600' },
      { professionalId: luciaProfile.id, name: 'Pedicure Clásico', description: 'Remojo, exfoliación y esmaltado.', price: 40, duration: 50, photoUrl: 'https://picsum.photos/seed/pedicure-clasico/600/600' },
      { professionalId: luciaProfile.id, name: 'Diseño de Uñas (por mano)', description: 'Diseños pintados a mano.', price: 15, duration: 20, photoUrl: 'https://picsum.photos/seed/diseno-unas/600/600' },
    ],
    skipDuplicates: true,
  });

  await prisma.availability.createMany({
    data: [
      { professionalId: luciaProfile.id, dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
      { professionalId: luciaProfile.id, dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
      { professionalId: luciaProfile.id, dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
    ],
    skipDuplicates: true,
  });

  await prisma.platformSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings' },
  });

  console.log('Datos de ejemplo cargados. Cuentas de prueba (contraseña: "password123"):');
  console.log('  admin@aura.studio (ADMIN)');
  console.log('  client@aura.studio (CLIENT)');
  console.log('  dueno1@aura.studio / dueno2@aura.studio (BUSINESS_OWNER)');
  console.log('  maria@aura.studio / lucia@aura.studio (PROFESSIONAL)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
