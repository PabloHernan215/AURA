import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-4 h-9 w-full max-w-sm" />
          <Skeleton className="mt-3 h-9 w-2/3" />
          <Skeleton className="mt-6 h-4 w-full max-w-md" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-md" />
          <Skeleton className="mt-9 h-12 w-40 rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
