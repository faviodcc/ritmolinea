import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { shuffle, songMatchesMode } from '@/lib/game/modes';
import type { Song } from '@/types/game';

const schema = z.object({
  mode: z.string().default('random'),
  totalRounds: z.number().int().min(3).max(50).default(15),
  timeLimit: z.number().int().min(5).max(60).default(15),
  revealSeconds: z.number().int().min(3).max(20).default(5),
  maxPlayers: z.number().int().min(2).max(40).default(12),
  theme: z.string().default('neon-night'),
  scoring: z.object({ exact: z.number().int().min(0).max(1000), oneAway: z.number().int().min(0).max(1000), twoAway: z.number().int().min(0).max(1000), streakStep: z.number().int().min(0).max(200), streakCap: z.number().int().min(0).max(1000) }).optional()
});

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code() { return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(''); }

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data: songs, error: songError } = await supabase.from('songs').select('*').eq('is_active', true).limit(2000);
    if (songError) throw songError;
    const eligible = shuffle((songs as Song[]).filter((song) => songMatchesMode(song, body.mode)));
    if (eligible.length < body.totalRounds + 1) throw new Error(`El modo seleccionado necesita al menos ${body.totalRounds + 1} canciones activas y solo tiene ${eligible.length}. Agrega más en Biblioteca o reduce las rondas.`);

    let gameCode = code();
    for (let i = 0; i < 6; i += 1) {
      const { data } = await supabase.from('games').select('id').eq('code', gameCode).maybeSingle();
      if (!data) break;
      gameCode = code();
    }
    const { data: game, error } = await supabase.from('games').insert({
      code: gameCode, host_user_id: user.id, mode: body.mode, total_rounds: body.totalRounds,
      time_limit: body.timeLimit, reveal_seconds: body.revealSeconds, max_players: body.maxPlayers,
      theme: body.theme, scoring: body.scoring ?? undefined
    }).select('*').single();
    if (error) throw error;
    const queue = eligible.slice(0, body.totalRounds + 1).map((song, position) => ({ game_id: game.id, position, song_id: song.id }));
    const { error: queueError } = await supabase.from('game_song_queue').insert(queue);
    if (queueError) { await supabase.from('games').delete().eq('id', game.id); throw queueError; }
    return NextResponse.json({ code: gameCode });
  } catch (error) { return apiError(error); }
}
