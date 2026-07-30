// Sends transactional emails through Resend's API.
//
// Requires two environment variables (see .env.example):
//   RESEND_API_KEY
//   EMAIL_FROM   (e.g. "AURA <onboarding@resend.dev>" for testing,
//                 or "AURA <noreply@tudominio.com>" once you verify a domain)
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
 * Sent right when the client submits a booking request — status is still PENDING at
 * this point, so the copy makes clear it's awaiting the professional's confirmation.
 * Goes to the client, the professional (as a WhatsApp backup), the business owner, and
 * every admin. Never throws — a failure here never affects the already-saved booking.
 */
export async function sendBookingRequestEmails(
  data: BookingEmailData,
  ccEmails: string[]
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
    `¡Hola ${data.clientName}! Recibimos tu solicitud de cita`,
    `<p>El local la confirmará en breve — te avisaremos apenas lo haga.</p>${detailsHtml}`
  );

  const professionalHtml = emailShell(
    'Nueva reserva pendiente de confirmar',
    `<p>👤 <strong>Cliente:</strong> ${data.clientName} (${data.clientEmail})</p>${detailsHtml}`
  );

  const adminHtml = emailShell(
    'Nueva solicitud de reserva en la plataforma',
    `<p>👤 <strong>Cliente:</strong> ${data.clientName} (${data.clientEmail})</p>${detailsHtml}`
  );

  const [clientResult] = await Promise.all([
    sendEmail(data.clientEmail, 'Recibimos tu solicitud de cita — AURA', clientHtml),
    data.professionalEmail
      ? sendEmail(data.professionalEmail, 'Nueva reserva pendiente de confirmar — AURA', professionalHtml)
      : Promise.resolve({ success: false }),
    ...ccEmails.map((email) => sendEmail(email, 'Nueva solicitud de reserva — AURA', adminHtml)),
  ]);

  return { clientEmailed: clientResult.success };
}

interface BookingConfirmedEmailData {
  clientName: string;
  clientEmail: string;
  professionalName: string;
  serviceName: string;
  datetime: Date;
  location: string | null;
  paymentMethods: string;
}

/**
 * Sent to the client only, once the professional/local confirms the booking.
 * Never throws — a failure here never affects the booking, which is already confirmed.
 */
export async function sendBookingConfirmedEmail(data: BookingConfirmedEmailData): Promise<boolean> {
  const when = formatDateTimeEs(data.datetime);
  const address = data.location?.trim() || 'Te confirmaremos la dirección exacta por otro medio.';

  const html = emailShell(
    `¡Hola ${data.clientName}! Tu cita quedó confirmada ✅`,
    `
      <p>💇 <strong>Servicio:</strong> ${data.serviceName}</p>
      <p>🧑‍🎨 <strong>Profesional:</strong> ${data.professionalName}</p>
      <p>🗓️ <strong>Fecha:</strong> ${when}</p>
      <p>📍 <strong>Dirección:</strong> ${address}</p>
      <p>💳 <strong>Formas de pago:</strong> ${data.paymentMethods}</p>
    `
  );

  const result = await sendEmail(data.clientEmail, 'Tu cita en AURA está confirmada', html);
  return result.success;
}
