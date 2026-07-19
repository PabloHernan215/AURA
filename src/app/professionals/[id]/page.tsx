import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StarRating from '@/components/StarRating';
import Avatar from '@/components/Avatar';
import ServiceCard from '@/components/ServiceCard';
import DistanceBadge from '@/components/DistanceBadge';
import { SITE_URL } from '@/lib/site';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const professional = await getProfessional(params.id);
  if (!professional) return {};

  const tags = professional.specialties.split(',').map((s) => s.trim()).filter(Boolean);
  const title = tags.length ? `${professional.user.name} — ${tags.join(', ')}` : professional.user.name;
  const description = professional.bio
    ? professional.bio.slice(0, 155)
    : `Reserva una cita con ${professional.user.name} en AURA. ${tags.join(', ')}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/professionals/${professional.id}` },
    openGraph: { title, description, url: `${SITE_URL}/professionals/${professional.id}`, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

async function getProfessional(id: string) {
  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, isActive: true } },
      services: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      bookings: {
        where: { status: 'COMPLETED' },
        include: { review: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!professional || !professional.user.isActive || !professional.isApproved) return null;
  return professional;
}

export default async function ProfessionalProfilePage({ params }: { params: { id: string } }) {
  const professional = await getProfessional(params.id);
  if (!professional) notFound();

  const tags = professional.specialties.split(',').map((s) => s.trim()).filter(Boolean);
  const reviews = professional.bookings.filter((b) => b.review);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: professional.user.name,
    url: `${SITE_URL}/professionals/${professional.id}`,
    ...(professional.photoUrl ? { image: professional.photoUrl } : {}),
    ...(professional.location ? { address: professional.location } : {}),
    ...(professional.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: professional.ratingAvg,
            reviewCount: professional.ratingCount,
          },
        }
      : {}),
    makesOffer: professional.services.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, description: s.description || undefined },
      price: s.price,
      priceCurrency: 'USD',
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-moss-100 to-clay-100" />
        <div className="px-6 pb-6">
          <div className="-mt-12">
            <Avatar name={professional.user.name} photoUrl={professional.photoUrl} size="lg" className="border-4 border-white shadow-md" />
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{professional.user.name}</h1>
              {professional.location && <p className="text-sm text-ink/50">{professional.location}</p>}
              <DistanceBadge latitude={professional.latitude} longitude={professional.longitude} />
            </div>
            <div className="flex items-center gap-3">
              <StarRating rating={professional.ratingAvg} count={professional.ratingCount} size="md" />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink/70">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {professional.bio && <p className="mt-4 text-sm leading-relaxed text-ink/70">{professional.bio}</p>}
        </div>
      </div>

      {/* Servicios */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Servicios</h2>
        <p className="mt-1 text-sm text-ink/50">Pasa el cursor o toca una foto para ver el detalle.</p>
        {professional.services.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Este profesional aún no ha publicado servicios.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {professional.services.map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                description={service.description}
                price={service.price}
                duration={service.duration}
                photoUrl={service.photoUrl}
                actionLabel="Reservar"
                actionHref={`/book/${professional.id}/${service.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reseñas */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">
          Reseñas {reviews.length > 0 && <span className="text-ink/40">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Aún no hay reseñas.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((booking) => (
              <div key={booking.review!.id} className="card p-4">
                <StarRating rating={booking.review!.rating} />
                {booking.review!.comment && (
                  <p className="mt-2 text-sm text-ink/70">{booking.review!.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
