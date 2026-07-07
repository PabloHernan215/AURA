'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ServiceCard from '@/components/ServiceCard';
import { resizeImageToBase64 } from '@/lib/image';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl: string | null;
  isActive: boolean;
}

export default function ProfessionalServicesPage() {
  const { status } = useSession();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch('/api/professionals/me')
      .then((res) => res.json())
      .then((data) => setServices(data.services ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen es muy pesada. Intenta con una de menos de 8 MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const resized = await resizeImageToBase64(file, 480, 0.82);
      setPhotoUrl(resized);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCreate() {
    setError('');
    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration, 10);

    if (!name || isNaN(priceNum) || priceNum <= 0 || isNaN(durationNum) || durationNum <= 0) {
      setError('Completa todos los campos con valores válidos');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        price: priceNum,
        duration: durationNum,
        photoUrl: photoUrl ?? '',
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? 'Algo salió mal');
      return;
    }

    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setPhotoUrl(null);
    setShowForm(false);
    load();
  }

  async function handleDeactivate(id: string) {
    if (!confirm('¿Eliminar este servicio de tu lista?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/dashboard/professional" className="text-sm text-ink/50 hover:text-ink">
        ← Panel
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Tus servicios</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary py-2 text-sm">
          {showForm ? 'Cancelar' : '+ Agregar servicio'}
        </button>
      </div>
      <p className="mt-1 text-sm text-ink/50">
        Sube una foto del trabajo terminado por cada servicio — es lo primero que verán tus clientes.
      </p>

      {showForm && (
        <div className="card mt-4 space-y-3 p-5">
          <div>
            <label className="label">Foto del trabajo terminado</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink/30">
                    <span className="text-2xl">✂</span>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn-secondary py-2 text-sm"
                >
                  {uploadingPhoto ? 'Procesando…' : photoUrl ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Corte Signature" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lavado, corte y estilizado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Precio ($)</label>
              <input className="input" type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="45" />
            </div>
            <div>
              <label className="label">Duración (min)</label>
              <input className="input" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" />
            </div>
          </div>
          {error && <p className="text-sm text-moss-600">{error}</p>}
          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando…' : 'Agregar servicio'}
          </button>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando…</p>
        ) : services.length === 0 ? (
          <p className="rounded-xl bg-sand px-4 py-6 text-center text-sm text-ink/60">
            Aún no hay servicios. Agrega el primero arriba.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="relative">
                <ServiceCard name={s.name} description={s.description} price={s.price} duration={s.duration} photoUrl={s.photoUrl} />
                <button
                  onClick={() => handleDeactivate(s.id)}
                  className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-moss-600 shadow-sm hover:underline"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
