import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({ code: z.string().trim().length(6).transform((v: string) => v.toUpperCase()), name: z.string().trim().min(1).max(24), avatarId: z.string().min(1).max(40) });
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const input = schema.parse(await request.json());
    const db = getSupabaseAdmin();
    const { data: game } = await db.from('games').select('*').eq('code', input.code).maybeSingle();
    if (!game) throw new Error('No existe una partida con ese código.');
    if (game.status !== 'waiting') throw new Error('La partida ya comenzó.');
    const { count } = await db.from('game_players').select('*', { count: 'exact', head: true }).eq('game_id', game.id);
    if ((count ?? 0) >= game.max_players) throw new Error('La partida está llena.');
    const { data: existing } = await db.from('game_players').select('*').eq('game_id', game.id).eq('user_id', user.id).maybeSingle();
    if (existing) return NextResponse.json({ code: game.code, playerId: existing.id });
    const { data: duplicate } = await db.from('game_players').select('id').eq('game_id', game.id).ilike('name', input.name).maybeSingle();
    if (duplicate) throw new Error('Ese nombre ya está en uso en la partida.');
    const { data: player, error } = await db.from('game_players').insert({ game_id: game.id, user_id: user.id, name: input.name, avatar_id: input.avatarId }).select('*').single();
    if (error) throw error;
    await db.from('profiles').update({ display_name: input.name, avatar_id: input.avatarId }).eq('id', user.id);
    return NextResponse.json({ code: game.code, playerId: player.id });
  } catch (error) { return apiError(error); }
}
