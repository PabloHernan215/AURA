const SIZE_MAP = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-xl',
  card: 'h-[77px] w-[77px] text-2xl',
  lg: 'h-24 w-24 text-3xl',
};

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'card' | 'lg';
  className?: string;
}

export default function Avatar({ name, photoUrl, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const sizeClasses = SIZE_MAP[size];

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-moss-500 font-display font-semibold text-white ring-2 ring-white ${className}`}
    >
      {initial}
    </div>
  );
}
