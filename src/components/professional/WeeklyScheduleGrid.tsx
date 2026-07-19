import { WEEKDAY_LABELS } from './WeeklyAvailabilityForm';

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleGridProps {
  windows: AvailabilityWindow[];
  onRemove: (id: string) => void;
}

// Cuadrícula semanal (Domingo → Sábado) con los bloques de disponibilidad de cada día,
// para que el profesional vea su horario completo de un vistazo en vez de una lista larga.
export default function WeeklyScheduleGrid({ windows, onRemove }: WeeklyScheduleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {WEEKDAY_LABELS.map((label, dayIndex) => {
        const dayWindows = windows
          .filter((w) => w.dayOfWeek === dayIndex)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div key={label} className="card min-h-[104px] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">{label.slice(0, 3)}</p>
            {dayWindows.length === 0 ? (
              <p className="mt-2 text-xs text-ink/30">Sin horario</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {dayWindows.map((w) => (
                  <div
                    key={w.id}
                    className="group flex items-center justify-between gap-1 rounded-md bg-sand px-2 py-1.5 text-xs font-medium text-ink/70"
                  >
                    <span>
                      {w.startTime}–{w.endTime}
                    </span>
                    <button
                      onClick={() => onRemove(w.id)}
                      className="text-ink/30 transition-colors hover:text-moss-600"
                      aria-label={`Eliminar bloque de ${label} ${w.startTime}-${w.endTime}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
