import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().max(30).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    if (parsed.data.email) {
      const normalizedEmail = parsed.data.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && existing.id !== params.id) {
        return NextResponse.json({ error: 'Ya existe otra cuenta con ese correo electrónico' }, { status: 409 });
      }
      parsed.data.email = normalizedEmail;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, whatsapp: updated.whatsapp });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
