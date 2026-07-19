import { Skeleton, ProfessionalGridSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-2 h-8 w-72" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-10">
        <ProfessionalGridSkeleton />
      </div>
    </div>
  );
}
