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
    const normalizedCode = code.toUpperCase();
    const db = getSupabaseAdmin();

    const { data: game, error: gameError } = await db
      .from('games')
      .select('host_user_id,code')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (gameError) throw gameError;
    if (!game) throw new Error('Partida no encontrada.');
    if (game.host_user_id !== user.id) throw new Error('FORBIDDEN');

    const { error } = await db.rpc('start_game_by_code', {
      p_code: game.code
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
