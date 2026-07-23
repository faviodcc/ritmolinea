import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function requireUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHORIZED');
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');
  return data.user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request);
  const { data } = await getSupabaseAdmin().from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}
