import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Selecciona una imagen válida.');
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 5 MB.');
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) throw new Error('Solo se permiten imágenes JPG, PNG o WebP.');

    const path = `${user.id}/${randomUUID()}.${extension}`;
    const db = getSupabaseAdmin();
    const { error } = await db.storage.from('song-covers').upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false
    });
    if (error) throw error;
    const { data } = db.storage.from('song-covers').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}
