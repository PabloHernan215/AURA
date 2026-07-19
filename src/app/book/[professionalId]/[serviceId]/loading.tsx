import { Skeleton, SkeletonCircle } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-7 w-64" />
      <div className="mt-3 flex items-center gap-3">
        <SkeletonCircle size={64} />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <Skeleton className="mt-6 h-56 w-full" />
      <Skeleton className="mt-4 h-24 w-full" />
    </div>
  );
}
