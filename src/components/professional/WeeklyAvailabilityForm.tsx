'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { availabilityWindowSchema, type AvailabilityWindowInput } from '@/lib/schemas';

export const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface WeeklyAvailabilityFormProps {
  onSubmit: (data: AvailabilityWindowInput) => Promise<{ error?: string } | void>;
}

// Formulario para agregar un bloque recurrente de disponibilidad. Valida con el mismo
// esquema Zod que usa la API (`src/lib/schemas.ts`), así las reglas nunca divergen entre
// cliente y servidor, y muestra los errores en tiempo real bajo cada campo.
export default function WeeklyAvailabilityForm({ onSubmit }: WeeklyAvailabilityFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityWindowInput>({
    resolver: zodResolver(availabilityWindowSchema),
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  });

  async function submit(data: AvailabilityWindowInput) {
    const result = await onSubmit(data);
    if (result?.error) {
      setError('endTime', { message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="card space-y-3 p-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="dayOfWeek">
            Día
          </label>
          <select id="dayOfWeek" className="input" {...register('dayOfWeek', { valueAsNumber: true })}>
            {WEEKDAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="startTime">
            Inicio
          </label>
          <input id="startTime" type="time" className="input" {...register('startTime')} />
          {errors.startTime && <p className="mt-1 text-xs text-moss-600">{errors.startTime.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="endTime">
            Fin
          </label>
          <input id="endTime" type="time" className="input" {...register('endTime')} />
          {errors.endTime && <p className="mt-1 text-xs text-moss-600">{errors.endTime.message}</p>}
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Agregando…' : 'Agregar bloque'}
      </button>
    </form>
  );
}
