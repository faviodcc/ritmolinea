import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireUser(request);
    const { code } = await params;
    const { ready } = await request.json();
    const db = getSupabaseAdmin();

    const { data: game, error: gameError } = await db
      .from('games')
      .select('id,code,status')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (gameError) throw gameError;
    if (!game) throw new Error('Partida no encontrada.');
    if (game.status !== 'waiting') {
      throw new Error('La partida ya comenzó.');
    }

    const { error: updateError } = await db
      .from('game_players')
      .update({ ready: Boolean(ready) })
      .eq('game_id', game.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    const { data: players, error: playersError } = await db
      .from('game_players')
      .select('ready')
      .eq('game_id', game.id);

    if (playersError) throw playersError;

    const playerList = players ?? [];

    if (
      playerList.length >= 2 &&
      playerList.every((player) => Boolean(player.ready))
    ) {
      const { error: startError } = await db.rpc('start_game_by_code', {
        p_code: game.code
      });

      if (startError) throw startError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
