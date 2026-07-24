import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geo';

const registerSchema = z
  .object({
    name: z.string().min(2, 'El nombre es muy corto'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['CLIENT', 'PROFESSIONAL', 'BUSINESS_OWNER']),
    whatsapp: z.string().max(30).optional(),
    // Only required when role === 'BUSINESS_OWNER'
    businessName: z.string().max(100).optional(),
    businessLocation: z.string().max(200).optional(),
    // Only required when role === 'PROFESSIONAL'
    businessId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.whatsapp?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de WhatsApp es obligatorio para recibir la confirmación de tus citas',
        path: ['whatsapp'],
      });
    }
    if (data.role === 'BUSINESS_OWNER') {
      if (!data.businessName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre de tu local es obligatorio',
          path: ['businessName'],
        });
      }
      if (!data.businessLocation?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección de tu local es obligatoria',
          path: ['businessLocation'],
        });
      }
    }
    if (data.role === 'PROFESSIONAL' && !data.businessId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el local donde trabajas',
        path: ['businessId'],
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

    const { name, email, password, role, whatsapp, businessName, businessLocation, businessId } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo electrónico' }, { status: 409 });
    }

    // If joining as staff, the business must exist and already be approved —
    // clients should never be able to book at an unvetted venue.
    if (role === 'PROFESSIONAL') {
      const business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business || !business.isApproved) {
        return NextResponse.json({ error: 'El local seleccionado no es válido' }, { status: 400 });
      }
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

    if (role === 'BUSINESS_OWNER') {
      // Geocode the address in the background — best-effort, never blocks registration.
      const coords = await geocodeAddress(businessLocation!.trim());

      await prisma.business.create({
        data: {
          ownerId: user.id,
          name: businessName!.trim(),
          location: businessLocation!.trim(),
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          whatsapp: whatsapp?.trim() ?? '',
          isApproved: false,
        },
      });
    }

    if (role === 'PROFESSIONAL') {
      await prisma.professionalProfile.create({
        data: { userId: user.id, businessId: businessId!, whatsapp: whatsapp?.trim() ?? '' },
      });
    }

    return NextResponse.json(
      { id: user.id, email: user.email, needsApproval: role === 'BUSINESS_OWNER' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Algo salió mal. Inténtalo de nuevo.' }, { status: 500 });
  }
}
