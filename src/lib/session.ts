import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Role } from '@/types/models';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error('No autenticado') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    const err = new Error('No autorizado') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}
