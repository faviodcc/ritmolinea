import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type TimelineRow = { acquired_round: number; song: { release_year: number } };

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    const { code } = await params;
    const db = getSupabaseAdmin();
    const { data: game } = await db.from('games').select('*').eq('code', code.toUpperCase()).maybeSingle();
    if (!game) throw new Error('Partida no encontrada.');
    const isHost = game.host_user_id === user.id;
    const { data: me } = await db.from('game_players').select('*').eq('game_id', game.id).eq('user_id', user.id).maybeSingle();
    if (!isHost && !me) throw new Error('FORBIDDEN');
    const { data: players } = isHost
      ? await db.from('game_players').select('*').eq('game_id', game.id).order('score', { ascending: false })
      : await db.from('game_players').select('*').eq('id', me!.id);
    const { data: round } = game.current_round > 0
      ? await db.from('game_rounds').select('*').eq('game_id', game.id).eq('round_number', game.current_round).maybeSingle()
      : { data: null };
    let roundPayload = null;
    if (round) {
      const { count } = await db.from('round_answers').select('*', { count: 'exact', head: true }).eq('round_id', round.id).not('submitted_at', 'is', null);
      roundPayload = {
        id: round.id,
        round_number: round.round_number,
        status: round.status,
        started_at: round.started_at,
        answer_deadline: round.answer_deadline,
        resolved_at: round.resolved_at,
        reveal_ends_at: round.reveal_ends_at,
        response_count: count ?? 0
      } as Record<string, unknown>;
      if (isHost && round.status === 'waiting_scan') {
        const { data: scan } = await db.from('game_round_scan_tokens').select('scan_token').eq('round_id', round.id).single();
        if (scan?.scan_token) roundPayload.scan_url = `${request.nextUrl.origin}/scan/${scan.scan_token}`;
      }
      if (round.status === 'revealed' || round.status === 'closed' || game.status === 'finished') {
        const { data: song } = await db.from('songs').select('id,title,artist,release_year,image_url,genre,country').eq('id', round.song_id).single();
        roundPayload.song = song;
        if (isHost) {
          const { data: answers } = await db.from('round_answers').select('intended_index,title_guess,title_correct,title_score,distance,base_score,streak_bonus,total_score,is_exact,is_late,player:game_players(id,name,avatar_id)').eq('round_id', round.id).order('total_score', { ascending: false });
          roundPayload.answers = answers ?? [];
        }
      }
      if (!isHost && me) {
        const { data: myAnswer } = await db.from('round_answers').select('intended_index,title_guess,title_correct,title_score,distance,base_score,streak_bonus,total_score,is_exact,is_late').eq('round_id', round.id).eq('player_id', me.id).maybeSingle();
        roundPayload.my_answer = myAnswer;
      }
    }
    let timeline: unknown[] = [];
    if (!isHost && me) {
      const { data } = await db.from('player_cards').select('id,song_id,acquired_round,song:songs(id,title,artist,release_year,image_url,genre)').eq('player_id', me.id);
      timeline = ((data ?? []) as unknown as TimelineRow[]).sort((a, b) => a.song.release_year - b.song.release_year || a.acquired_round - b.acquired_round);
    }
    let results;
    if (game.status === 'finished') {
      const { data } = await db.from('game_results').select('user_id,player_name,avatar_id,score,exact_hits,max_streak,rank').eq('game_id', game.id).order('rank');
      results = data ?? [];
    }
    return NextResponse.json({ role: isHost ? 'host' : 'player', game, players: players ?? [], me: me ?? null, round: roundPayload, timeline, results });
  } catch (error) { return apiError(error); }
}
