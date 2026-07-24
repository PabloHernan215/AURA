export default function StarRating({
  rating,
  count,
  size = 'sm',
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}) {
  const dimension = size === 'sm' ? 14 : 18;

  return (
    <span className="inline-flex items-center gap-1">
      <svg width={dimension} height={dimension} viewBox="0 0 20 20" fill="#A67C4D">
        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6L10 1.5z" />
      </svg>
      <span className="text-sm font-medium text-ink">{rating > 0 ? rating.toFixed(1) : 'Nuevo'}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-sm text-ink/50">({count})</span>
      )}
    </span>
  );
}
