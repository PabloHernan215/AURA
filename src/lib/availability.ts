import { prisma } from '@/lib/prisma';

/**
 * AURA Studio slot engine.
 *
 * Slots are NEVER pre-generated/stored. They are computed on every read from:
 *   1. The professional's recurring weekly Availability windows
 *   2. Minus any existing non-cancelled Bookings on that date
 *
 * This guarantees the client always sees truly current availability, and keeps
 * the source of truth in one place (Availability + Booking), avoiding drift
 * between a stored "slots" table and reality.
 */

const SLOT_STEP_MINUTES = 15; // granularity at which slots are offered

export interface TimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function dateAtMinutes(base: Date, minutes: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

/**
 * Returns bookable slots for a given professional, calendar date, and service duration.
 * `date` should be a Date representing midnight of the target day (local).
 */
export async function getAvailableSlots(
  professionalId: string,
  date: Date,
  serviceDurationMin: number
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();

  const windows = await prisma.availability.findMany({
    where: { professionalId, dayOfWeek },
  });

  if (windows.length === 0) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      datetime: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { datetime: true, durationMin: true },
  });

  const now = new Date();
  const slots: TimeSlot[] = [];

  for (const window of windows) {
    const windowStartMin = timeStrToMinutes(window.startTime);
    const windowEndMin = timeStrToMinutes(window.endTime);

    for (
      let cursor = windowStartMin;
      cursor + serviceDurationMin <= windowEndMin;
      cursor += SLOT_STEP_MINUTES
    ) {
      const slotStart = dateAtMinutes(date, cursor);
      const slotEnd = dateAtMinutes(date, cursor + serviceDurationMin);

      // Skip slots in the past
      if (slotStart < now) continue;

      // Skip slots that overlap any existing booking
      const overlaps = existingBookings.some((b) => {
        const bStart = new Date(b.datetime);
        const bEnd = new Date(bStart.getTime() + b.durationMin * 60000);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!overlaps) {
        slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
      }
    }
  }

  return slots;
}

/**
 * Server-side authority check: is this exact requested slot still free?
 * Called again inside the booking transaction, right before insert, to close
 * the race-condition window between "client fetched slots" and "client submits".
 */
export async function isSlotStillAvailable(
  professionalId: string,
  requestedStart: Date,
  durationMin: number
): Promise<boolean> {
  const requestedEnd = new Date(requestedStart.getTime() + durationMin * 60000);

  const dayOfWeek = requestedStart.getDay();
  const timeStr = `${String(requestedStart.getHours()).padStart(2, '0')}:${String(
    requestedStart.getMinutes()
  ).padStart(2, '0')}`;
  const requestedMinutes = timeStrToMinutes(timeStr);

  const windows = await prisma.availability.findMany({
    where: { professionalId, dayOfWeek },
  });

  const withinWindow = windows.some((w) => {
    const startMin = timeStrToMinutes(w.startTime);
    const endMin = timeStrToMinutes(w.endTime);
    return requestedMinutes >= startMin && requestedMinutes + durationMin <= endMin;
  });

  if (!withinWindow) return false;
  if (requestedStart < new Date()) return false;

  const dayStart = new Date(requestedStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(requestedStart);
  dayEnd.setHours(23, 59, 59, 999);

  const conflicting = await prisma.booking.findMany({
    where: {
      professionalId,
      datetime: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { datetime: true, durationMin: true },
  });

  const hasOverlap = conflicting.some((b) => {
    const bStart = new Date(b.datetime);
    const bEnd = new Date(bStart.getTime() + b.durationMin * 60000);
    return requestedStart < bEnd && requestedEnd > bStart;
  });

  return !hasOverlap;
}
