import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GAME_MODES } from '@/lib/constants';
import { songMatchesMode } from '@/lib/game/modes';
import type { Song } from '@/types/game';

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { data, error } = await getSupabaseAdmin().from('songs').select('*').eq('is_active', true).limit(5000);
    if (error) throw error;
    const songs = (data ?? []) as Song[];
    const counts = Object.fromEntries(GAME_MODES.map(([id]) => [id, songs.filter((song) => songMatchesMode(song, id)).length]));
    return NextResponse.json({ counts });
  } catch (error) {
    return apiError(error);
  }
}
