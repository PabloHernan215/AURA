// Role and BookingStatus are plain String columns in the database (not native
// Prisma enums). These types give us the same compile-time safety in app code.

export type Role = 'CLIENT' | 'PROFESSIONAL' | 'BUSINESS_OWNER' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
