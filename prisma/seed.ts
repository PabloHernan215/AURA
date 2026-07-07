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

  // Profesional #1 - Cabello
  const pro1User = await prisma.user.upsert({
    where: { email: 'maria@aura.studio' },
    update: { password, role: 'PROFESSIONAL', isActive: true },
    create: {
      name: 'María González',
      email: 'maria@aura.studio',
      password,
      role: 'PROFESSIONAL',
    },
  });

  const pro1Profile = await prisma.professionalProfile.upsert({
    where: { userId: pro1User.id },
    update: { isApproved: true },
    create: {
      userId: pro1User.id,
      bio: 'Colorista y estilista con 8 años de experiencia. Especialista en balayage y cortes de precisión.',
      specialties: 'Cabello,Color,Balayage',
      location: 'AURA Hub - Centro',
      latitude: 19.4326,
      longitude: -99.1332,
      whatsapp: '+52 55 1234 5678',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria-Gonzalez',
      ratingAvg: 4.8,
      ratingCount: 42,
      isApproved: true,
    },
  });

  await prisma.service.createMany({
    data: [
      { professionalId: pro1Profile.id, name: 'Corte Signature', description: 'Lavado, corte y estilizado a tu medida.', price: 45, duration: 45, photoUrl: 'https://picsum.photos/seed/corte-signature/600/600' },
      { professionalId: pro1Profile.id, name: 'Balayage Completo', description: 'Color pintado a mano para un efecto natural de sol.', price: 150, duration: 150, photoUrl: 'https://picsum.photos/seed/balayage-completo/600/600' },
      { professionalId: pro1Profile.id, name: 'Brushing', description: 'Lavado y secado profesional con acabado perfecto.', price: 30, duration: 30, photoUrl: 'https://picsum.photos/seed/brushing-look/600/600' },
    ],
  });

  await prisma.availability.createMany({
    data: [
      { professionalId: pro1Profile.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { professionalId: pro1Profile.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { professionalId: pro1Profile.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { professionalId: pro1Profile.id, dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
  });

  // Profesional #2 - Uñas
  const pro2User = await prisma.user.upsert({
    where: { email: 'lucia@aura.studio' },
    update: { password, role: 'PROFESSIONAL', isActive: true },
    create: {
      name: 'Lucía Fernández',
      email: 'lucia@aura.studio',
      password,
      role: 'PROFESSIONAL',
    },
  });

  const pro2Profile = await prisma.professionalProfile.upsert({
    where: { userId: pro2User.id },
    update: { isApproved: true },
    create: {
      userId: pro2User.id,
      bio: 'Especialista en uñas enfocada en trabajo en gel duradero y diseños pintados a mano.',
      specialties: 'Uñas,Gel,Bienestar',
      location: 'AURA Hub - Centro',
      latitude: 19.4326,
      longitude: -99.1332,
      whatsapp: '+52 55 8765 4321',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia-Fernandez',
      ratingAvg: 4.9,
      ratingCount: 67,
      isApproved: true,
    },
  });

  await prisma.service.createMany({
    data: [
      { professionalId: pro2Profile.id, name: 'Manicure en Gel', description: 'Esmaltado en gel de larga duración, incluye cuidado de cutículas.', price: 35, duration: 45, photoUrl: 'https://picsum.photos/seed/manicure-gel/600/600' },
      { professionalId: pro2Profile.id, name: 'Pedicure Clásico', description: 'Remojo, exfoliación y esmaltado.', price: 40, duration: 50, photoUrl: 'https://picsum.photos/seed/pedicure-clasico/600/600' },
      { professionalId: pro2Profile.id, name: 'Diseño de Uñas (por mano)', description: 'Diseños pintados a mano.', price: 15, duration: 20, photoUrl: 'https://picsum.photos/seed/diseno-unas/600/600' },
    ],
  });

  await prisma.availability.createMany({
    data: [
      { professionalId: pro2Profile.id, dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
      { professionalId: pro2Profile.id, dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
      { professionalId: pro2Profile.id, dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
    ],
  });

  await prisma.platformSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings' },
  });

  console.log('Datos de ejemplo cargados. Cuentas de prueba (contraseña: "password123"):');
  console.log('  admin@aura.studio (ADMIN)');
  console.log('  client@aura.studio (CLIENT)');
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
