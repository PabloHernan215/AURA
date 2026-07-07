// SQLite doesn't support native Prisma enums, so Role and BookingStatus are
// plain String columns in the database. These types give us the same
// compile-time safety in application code.

export type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
