import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({
  index: z.number().int().min(0).max(200),
  titleGuess: z.string().trim().min(1).max(120)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireUser(request);
    const { code } = await params;
    const { index, titleGuess } = schema.parse(await request.json());

    const { error } = await getSupabaseAdmin().rpc('submit_round_answer', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_index: index,
      p_title_guess: titleGuess
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
