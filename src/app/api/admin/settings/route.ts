import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/session';
import { getPlatformSettings, updatePaymentMethods } from '@/lib/settings';

export async function GET() {
  try {
    await requireRole('ADMIN');
    const settings = await getPlatformSettings();
    return NextResponse.json(settings);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}

const updateSchema = z.object({
  paymentMethods: z.string().max(500),
});

export async function PATCH(req: Request) {
  try {
    await requireRole('ADMIN');

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await updatePaymentMethods(parsed.data.paymentMethods);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status ?? 500 });
  }
}
