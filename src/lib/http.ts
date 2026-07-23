import { NextResponse } from 'next/server';
export function apiError(error: unknown, fallback = 'No se pudo completar la operación.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
  return NextResponse.json({ error: message === 'UNAUTHORIZED' ? 'Debes iniciar sesión.' : message === 'FORBIDDEN' ? 'No tienes permisos para realizar esta acción.' : message }, { status });
}
