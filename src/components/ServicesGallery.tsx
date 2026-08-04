'use client';

import { useState } from 'react';
import ServiceCard from './ServiceCard';
import ServiceDetailModal from './ServiceDetailModal';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl: string | null;
}

export default function ServicesGallery({
  services,
  professionalId,
}: {
  services: ServiceItem[];
  professionalId: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openService = services.find((s) => s.id === openId) ?? null;

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            name={service.name}
            description={service.description}
            price={service.price}
            duration={service.duration}
            photoUrl={service.photoUrl}
            onSelect={() => setOpenId(service.id)}
          />
        ))}
      </div>

      {openService && (
        <ServiceDetailModal
          name={openService.name}
          description={openService.description}
          price={openService.price}
          duration={openService.duration}
          photoUrl={openService.photoUrl}
          bookHref={`/book/${professionalId}/${openService.id}`}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
