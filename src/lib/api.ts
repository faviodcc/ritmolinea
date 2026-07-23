'use client';
import { ensureSession } from '@/lib/supabase/client';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await ensureSession();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? 'Ocurrió un error inesperado.');
  return payload as T;
}
