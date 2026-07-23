import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request); const { code } = await params; const { ready } = await request.json(); const db = getSupabaseAdmin();
    const { data: game } = await db.from('games').select('*').eq('code', code.toUpperCase()).single();
    if (game.status !== 'waiting') throw new Error('La partida ya comenzó.');
    const { error } = await db.from('game_players').update({ ready: Boolean(ready) }).eq('game_id', game.id).eq('user_id', user.id); if (error) throw error;
    const { data: players } = await db.from('game_players').select('ready').eq('game_id', game.id);
    if ((players?.length ?? 0) >= 2 && players?.every((p: { ready: boolean }) => p.ready)) await db.rpc('start_game_by_code', { p_code: game.code });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
