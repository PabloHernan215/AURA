'use client';

import { useState } from 'react';

export default function ReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, rating, comment }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? 'Algo salió mal');
      return;
    }
    onSubmitted();
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-sand/50 p-4">
      <p className="label">Califica tu experiencia</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            aria-label={`${star} estrellas`}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 20 20"
              fill={(hoverRating || rating) >= star ? '#A67C4D' : '#E0D8C8'}
            >
              <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6L10 1.5z" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        className="input mt-3"
        rows={3}
        placeholder="Cuéntale a otros tu experiencia (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <p className="mt-2 text-sm text-moss-600">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-3 w-full">
        {submitting ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </div>
  );
}
