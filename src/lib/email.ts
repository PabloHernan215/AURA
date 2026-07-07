// Sends transactional emails through Resend's API.
//
// Requires two environment variables (see .env.example):
//   RESEND_API_KEY
//   EMAIL_FROM   (e.g. "AURA Studio <onboarding@resend.dev>" for testing,
//                 or "AURA Studio <noreply@tudominio.com>" once you verify a domain)
//
// If these aren't set, sendEmail logs a warning and does nothing else — it NEVER
// throws, so a missing/broken email integration can never break the booking flow.

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn('[Email] RESEND_API_KEY o EMAIL_FROM no configurados — no se envió el correo.');
    return { success: false, error: 'El envío de correos no está configurado en el servidor' };
  }

  if (!to) {
    return { success: false, error: 'Destinatario vacío' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('[Email] Resend respondió con error:', errorData);
      return { success: false, error: errorData?.message ?? `Resend respondió con estado ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Email] Error de red al enviar correo:', err);
    return { success: false, error: err.message ?? 'Error de red al enviar el correo' };
  }
}

function formatDateTimeEs(date: Date): string {
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E1B1E;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top: 24px; font-size: 12px; color: #8a8385;">AURA · Beauty &amp; Wellness</p>
    </div>
  `;
}

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  professionalName: string;
  professionalEmail: string;
  serviceName: string;
  datetime: Date;
  location: string | null;
  paymentMethods: string;
}

/**
 * Sends the booking confirmation by email to the client and to every admin account.
 * Also copies the professional, as a backup in case their WhatsApp notification isn't
 * configured. Never throws — a failure here never affects the already-saved booking.
 */
export async function sendBookingEmails(
  data: BookingEmailData,
  adminEmails: string[]
): Promise<{ clientEmailed: boolean }> {
  const when = formatDateTimeEs(data.datetime);
  const address = data.location?.trim() || 'Te confirmaremos la dirección exacta por otro medio.';

  const detailsHtml = `
    <p>💇 <strong>Servicio:</strong> ${data.serviceName}</p>
    <p>🧑‍🎨 <strong>Profesional:</strong> ${data.professionalName}</p>
    <p>🗓️ <strong>Fecha:</strong> ${when}</p>
    <p>📍 <strong>Dirección:</strong> ${address}</p>
    <p>💳 <strong>Formas de pago:</strong> ${data.paymentMethods}</p>
  `;

  const clientHtml = emailShell(
    `¡Hola ${data.clientName}! Tu cita quedó confirmada ✅`,
    detailsHtml
  );

  const professionalHtml = emailShell(
    'Nueva reserva confirmada',
    `<p>👤 <strong>Cliente:</strong> ${data.clientName} (${data.clientEmail})</p>${detailsHtml}`
  );

  const adminHtml = emailShell(
    'Nueva reserva en la plataforma',
    `<p>👤 <strong>Cliente:</strong> ${data.clientName} (${data.clientEmail})</p>${detailsHtml}`
  );

  const [clientResult] = await Promise.all([
    sendEmail(data.clientEmail, 'Tu cita en AURA está confirmada', clientHtml),
    data.professionalEmail
      ? sendEmail(data.professionalEmail, 'Nueva reserva confirmada — AURA', professionalHtml)
      : Promise.resolve({ success: false }),
    ...adminEmails.map((email) => sendEmail(email, 'Nueva reserva en AURA', adminHtml)),
  ]);

  return { clientEmailed: clientResult.success };
}
