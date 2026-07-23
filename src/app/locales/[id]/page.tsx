import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StarRating from '@/components/StarRating';
import Avatar from '@/components/Avatar';
import DistanceBadge from '@/components/DistanceBadge';

async function getBusiness(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: { select: { isActive: true } },
      professionals: {
        include: {
          user: { select: { name: true } },
          services: { where: { isActive: true }, select: { id: true, price: true } },
        },
      },
    },
  });

  if (!business || !business.owner.isActive || !business.isApproved) return null;
  return business;
}

export default async function BusinessProfilePage({ params }: { params: { id: string } }) {
  const business = await getBusiness(params.id);
  if (!business) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-moss-100 to-clay-100">
          {business.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.photoUrl} alt={business.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="px-6 pb-6 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{business.name}</h1>
              {business.location && <p className="text-sm text-ink/50">{business.location}</p>}
              <DistanceBadge latitude={business.latitude} longitude={business.longitude} />
            </div>
            <StarRating rating={business.ratingAvg} count={business.ratingCount} size="md" />
          </div>

          {business.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink/70">{business.description}</p>
          )}
        </div>
      </div>

      {/* Profesionales */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Profesionales</h2>
        {business.professionals.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Este local aún no ha agregado profesionales.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {business.professionals.map((pro) => {
              const tags = pro.specialties.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
              const startingPrice = pro.services.length
                ? Math.min(...pro.services.map((s) => s.price))
                : null;

              return (
                <Link
                  key={pro.id}
                  href={`/professionals/${pro.id}`}
                  className="card flex items-center gap-4 p-4 transition-colors hover:border-moss-300"
                >
                  <Avatar name={pro.user.name} photoUrl={pro.photoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-display font-semibold text-ink">{pro.user.name}</h3>
                      <StarRating rating={pro.ratingAvg} count={pro.ratingCount} />
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-ink/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {typeof startingPrice === 'number' && (
                      <p className="mt-1 text-xs text-ink/50">
                        Desde <span className="font-semibold text-ink">${startingPrice}</span>
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
