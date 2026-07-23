'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ensureSession, getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { GameState } from '@/types/game';

export function useGameState(code:string){
  const[state,setState]=useState<GameState|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const refresh=useCallback(async()=>{try{const next=await apiFetch<GameState>(`/api/games/${code}/state`);setState(next);setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo sincronizar la partida.');}finally{setLoading(false)}},[code]);
  useEffect(()=>{let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | undefined;let cancelled=false;(async()=>{await ensureSession();if(cancelled)return;await refresh();const supabase=getSupabaseBrowserClient();const schedule=()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(refresh,80)};channel=supabase.channel(`game-${code}`).on('postgres_changes',{event:'*',schema:'public',table:'games'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'game_players'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'game_rounds'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'round_answers'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'player_cards'},schedule).subscribe();})();return()=>{cancelled=true;if(timer.current)clearTimeout(timer.current);if(channel)getSupabaseBrowserClient().removeChannel(channel);};},[code,refresh]);
  return{state,loading,error,refresh};
}

export function useNow(interval=250){const[now,setNow]=useState(()=>Date.now());useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),interval);return()=>clearInterval(id)},[interval]);return now;}
