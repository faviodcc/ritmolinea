import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const songSchema = z.object({
  title:z.string().trim().min(1).max(120), artist:z.string().trim().min(1).max(120),
  release_year:z.number().int().min(1900).max(2100), decade:z.number().int().min(1900).max(2100),
  genre:z.string().trim().min(1).max(60), country:z.string().trim().min(1).max(60),
  spotify_url:z.string().url().refine((v: string)=>v.startsWith('https://open.spotify.com/'),'Debe ser un enlace de open.spotify.com'),
  difficulty:z.number().int().min(1).max(5), image_url:z.string().url().nullable().optional(),
  tags:z.array(z.string().trim().min(1).max(40)).default([]), is_active:z.boolean().default(true)
});

export async function GET(request:NextRequest){try{await requireAdmin(request);const q=request.nextUrl.searchParams.get('q')?.trim();let query=getSupabaseAdmin().from('songs').select('*').order('artist').order('release_year');if(q)query=query.or(`title.ilike.%${q}%,artist.ilike.%${q}%,genre.ilike.%${q}%`);const{data,error}=await query.limit(2000);if(error)throw error;return NextResponse.json({songs:data??[]});}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{const user=await requireAdmin(request);const input=songSchema.parse(await request.json());const{data,error}=await getSupabaseAdmin().from('songs').insert({...input,image_url:input.image_url||null,created_by:user.id}).select('*').single();if(error)throw error;return NextResponse.json({song:data},{status:201});}catch(error){return apiError(error);}}
