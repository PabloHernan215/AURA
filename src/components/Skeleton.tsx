import clsx from 'clsx';

// Bloques base para armar pantallas de carga (skeletons) consistentes con la
// paleta de la app, evitando saltos de layout (CLS) al reservar el mismo
// espacio que ocupará el contenido real.
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-sand', className)} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={clsx('animate-pulse shrink-0 rounded-full bg-sand', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function ProfessionalCardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="h-36 w-full" />
      <div className="mt-4 flex items-center gap-3">
        <SkeletonCircle size={36} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function ProfessionalGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProfessionalCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfessionalProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="card overflow-hidden">
        <Skeleton className="h-28 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="-mt-12">
            <SkeletonCircle size={88} className="border-4 border-white" />
          </div>
          <Skeleton className="mt-4 h-6 w-48" />
          <Skeleton className="mt-2 h-3.5 w-32" />
        </div>
      </div>
      <div className="mt-10">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
