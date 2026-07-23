'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ensureSession, getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { GameState } from '@/types/game';

export function useGameState(code: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const realtimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;

    try {
      const next = await apiFetch<GameState>(`/api/games/${code}/state`);
      setState(next);
      setError('');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo sincronizar la partida.'
      );
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    let channel:
      | ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']>
      | undefined;

    const scheduleRealtimeRefresh = () => {
      if (realtimeTimer.current) clearTimeout(realtimeTimer.current);
      realtimeTimer.current = setTimeout(() => void refresh(), 80);
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void (async () => {
      await ensureSession();
      if (cancelled) return;

      await refresh();

      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel(`game-${code}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'games' },
          scheduleRealtimeRefresh
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_players' },
          scheduleRealtimeRefresh
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_rounds' },
          scheduleRealtimeRefresh
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'round_answers' },
          scheduleRealtimeRefresh
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'player_cards' },
          scheduleRealtimeRefresh
        )
        .subscribe();
    })();

    // Respaldo robusto: aunque Realtime se desconecte, la partida se actualiza sola.
    const pollingId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 1000);

    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(pollingId);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);

      if (realtimeTimer.current) clearTimeout(realtimeTimer.current);
      if (channel) void getSupabaseBrowserClient().removeChannel(channel);
    };
  }, [code, refresh]);

  return { state, loading, error, refresh };
}

export function useNow(interval = 250) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);

  return now;
}
