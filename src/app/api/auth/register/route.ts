import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre es muy corto'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['CLIENT', 'PROFESSIONAL']),
    whatsapp: z.string().max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.whatsapp?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de WhatsApp es obligatorio para recibir la confirmación de tus citas',
        path: ['whatsapp'],
      });
    }
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password, role, whatsapp } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo electrónico' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        whatsapp: whatsapp?.trim() ?? '',
      },
    });

    // Professionals get an empty profile shell immediately so they can start filling it in,
    // but it starts unapproved: it won't appear publicly or accept bookings until an admin
    // approves it from the admin dashboard.
    if (role === 'PROFESSIONAL') {
      await prisma.professionalProfile.create({
        data: { userId: user.id, isApproved: false, whatsapp: whatsapp?.trim() ?? '' },
      });
    }

    return NextResponse.json(
      { id: user.id, email: user.email, needsApproval: role === 'PROFESSIONAL' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Algo salió mal. Inténtalo de nuevo.' }, { status: 500 });
  }
}
