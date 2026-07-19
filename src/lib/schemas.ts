// Esquemas Zod compartidos entre las rutas de la API (validación de servidor) y los
// formularios del cliente (React Hook Form, vía @hookform/resolvers/zod). Mantenerlos
// aquí evita que las reglas de validación diverjan entre cliente y servidor.
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const availabilityWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, 'Usa el formato HH:mm'),
    endTime: z.string().regex(timeRegex, 'Usa el formato HH:mm'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'La hora de inicio debe ser antes de la hora de fin',
    path: ['endTime'],
  });

export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;
