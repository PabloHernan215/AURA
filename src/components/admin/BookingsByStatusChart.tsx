'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BookingLike {
  status: string;
}

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;

const STATUS_META: Record<(typeof STATUS_ORDER)[number], { label: string; color: string }> = {
  // Validated 4-slot categorical subset (dataviz skill) — passes CVD/normal-vision
  // all-pairs checks against a white surface; magenta/yellow sit under 3:1 contrast,
  // mitigated here with direct value labels above each bar (the "relief" rule).
  PENDING: { label: 'Pendiente', color: '#2a78d6' },
  CONFIRMED: { label: 'Confirmada', color: '#008300' },
  CANCELLED: { label: 'Cancelada', color: '#e87ba4' },
  COMPLETED: { label: 'Completada', color: '#eda100' },
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { label, count } = payload[0].payload;
  return (
    <div className="rounded-md border border-ink/10 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-ink/60">{count} reserva{count === 1 ? '' : 's'}</p>
    </div>
  );
}

export default function BookingsByStatusChart({ bookings }: { bookings: BookingLike[] }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: bookings.filter((b) => b.status === status).length,
    color: STATUS_META[status].color,
  }));

  return (
    <div className="card p-5">
      <p className="label">Reservas por estado</p>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B272314" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#2B272326' }}
              tick={{ fill: '#96897A', fontSize: 12 }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#96897A', fontSize: 12 }} width={28} />
            <Tooltip cursor={{ fill: '#2B27230A' }} content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
              <LabelList dataKey="count" position="top" style={{ fill: '#2B2723', fontSize: 12, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
