// Sends WhatsApp notifications through Twilio's WhatsApp API — always from the SAME
// single AURA number (TWILIO_WHATSAPP_FROM), to both professionals and clients. There
// is no per-user or per-business number: every message the platform sends comes from
// this one centralized AURA number.
//
// Requires three environment variables (see .env.example):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM   (e.g. "whatsapp:+14155238886" for Twilio's free sandbox number)
//
// If these aren't set, this logs a warning and does nothing else — it NEVER throws,
// so a missing/broken WhatsApp integration can never break the booking flow. The booking
// is always saved in the platform regardless of whether any message goes out.

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits.replace('+', '')) return null;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

async function sendWhatsAppMessage(toRawPhone: string, body: string): Promise<{ success: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.warn('[WhatsApp] Credenciales de Twilio no configuradas — no se envió la notificación.');
    return { success: false, error: 'WhatsApp no está configurado en el servidor (faltan credenciales de Twilio)' };
  }

  const to = normalizePhone(toRawPhone);
  if (!to) {
    return { success: false, error: 'Número de WhatsApp inválido o vacío' };
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      },
      body: new URLSearchParams({
        From: from, // always the one centralized AURA number
        To: `whatsapp:${to}`,
        Body: body,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('[WhatsApp] Twilio respondió con error:', errorData);
      return { success: false, error: errorData?.message ?? `Twilio respondió con estado ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[WhatsApp] Error de red al enviar mensaje:', err);
    return { success: false, error: err.message ?? 'Error de red al enviar WhatsApp' };
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

interface NewBookingNotification {
  professionalWhatsapp: string;
  professionalName: string;
  clientName: string;
  clientWhatsapp: string;
  serviceName: string;
  datetime: Date;
  location: string | null;
}

/**
 * Notifies the professional that they have a new booking AWAITING their confirmation.
 * Never throws — a failure here never affects the booking, which is already saved.
 */
export async function notifyProfessionalOfNewBooking(data: NewBookingNotification): Promise<boolean> {
  if (!data.professionalWhatsapp) return false;

  const when = formatDateTimeEs(data.datetime);
  const address = data.location?.trim() || 'sin dirección registrada';

  const message =
    `¡Hola ${data.professionalName}! Tienes una nueva reserva en *AURA* pendiente de confirmar 📅\n\n` +
    `👤 Cliente: ${data.clientName}\n` +
    `📱 WhatsApp del cliente: ${data.clientWhatsapp || 'no disponible'}\n` +
    `💇 Servicio: ${data.serviceName}\n` +
    `🗓️ Fecha: ${when}\n` +
    `📍 Dirección: ${address}\n\n` +
    `Entra a tu panel de AURA para confirmarla.`;

  const result = await sendWhatsAppMessage(data.professionalWhatsapp, message);
  return result.success;
}

interface BookingConfirmedNotification {
  clientWhatsapp: string;
  clientName: string;
  professionalName: string;
  serviceName: string;
  datetime: Date;
  location: string | null;
  paymentMethods: string;
}

/**
 * Notifies the client that their booking was confirmed by the professional/local —
 * sent from the same centralized AURA number as every other message on the platform.
 * Never throws — a failure here never affects the booking, which is already saved.
 */
export async function notifyClientOfConfirmedBooking(data: BookingConfirmedNotification): Promise<boolean> {
  if (!data.clientWhatsapp) return false;

  const when = formatDateTimeEs(data.datetime);
  const address = data.location?.trim() || 'Te confirmaremos la dirección exacta por este medio.';

  const message =
    `¡Hola ${data.clientName}! Tu cita en *AURA* quedó confirmada ✅\n\n` +
    `💇 Servicio: ${data.serviceName}\n` +
    `🧑‍🎨 Profesional: ${data.professionalName}\n` +
    `🗓️ Fecha: ${when}\n` +
    `📍 Dirección: ${address}\n` +
    `💳 Formas de pago: ${data.paymentMethods}\n\n` +
    `¡Te esperamos!`;

  const result = await sendWhatsAppMessage(data.clientWhatsapp, message);
  return result.success;
}

interface BusinessApprovedNotification {
  ownerWhatsapp: string;
  ownerName: string;
  businessName: string;
}

/**
 * Notifies a business owner that their local was approved and is now live on AURA.
 * Never throws — a failure here never affects the approval, which is already saved.
 */
export async function notifyBusinessApproved(data: BusinessApprovedNotification): Promise<boolean> {
  if (!data.ownerWhatsapp) return false;

  const message =
    `¡Hola ${data.ownerName}! 🎉 Tu local *${data.businessName}* fue aprobado en *AURA*.\n\n` +
    `Ya es visible para los clientes y puede recibir reservas. Entra a tu panel para completar tu perfil, ` +
    `agregar profesionales y empezar a recibir citas.`;

  const result = await sendWhatsAppMessage(data.ownerWhatsapp, message);
  return result.success;
}
