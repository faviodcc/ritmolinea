import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { songSchema } from '../route';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const input = songSchema.partial().parse(await request.json());
    const { data, error } = await getSupabaseAdmin().from('songs').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ song: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const db = getSupabaseAdmin();
    const { count, error: countError } = await db.from('game_song_queue').select('*', { count: 'exact', head: true }).eq('song_id', id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      const { data, error } = await db.from('songs').update({ is_active: false }).eq('id', id).select('*').single();
      if (error) throw error;
      return NextResponse.json({ deleted: false, archived: true, song: data });
    }
    const { error } = await db.from('songs').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ deleted: true, archived: false });
  } catch (error) {
    return apiError(error);
  }
}
