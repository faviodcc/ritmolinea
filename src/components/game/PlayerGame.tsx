'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Flame,
  Home,
  LoaderCircle,
  Music2,
  Radio,
  Sparkles,
  Trophy,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGameState, useNow } from '@/hooks/useGameState';
import { apiFetch } from '@/lib/api';
import { avatarEmoji, formatMode } from '@/lib/utils';
import { TimelineBoard } from './TimelineBoard';
import { playTone } from '@/lib/sounds';

export function PlayerGame({ code }: { code: string }) {
  const { state, loading, error, refresh } = useGameState(code);
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [titleGuess, setTitleGuess] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const revealed = useRef('');
  const initializedRound = useRef('');
  const lastSubmitted = useRef('');

  const seconds = state?.round?.answer_deadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(state.round.answer_deadline).getTime() - now) / 1000
        )
      )
    : 0;

  useEffect(() => {
    const round = state?.round;
    if (!round || initializedRound.current === round.id) return;

    initializedRound.current = round.id;
    const answer = round.my_answer;
    const initialIndex = answer?.intended_index ?? null;
    const initialTitle = answer?.title_guess ?? '';

    setSelected(initialIndex);
    setTitleGuess(initialTitle);
    setLocalError('');
    setSaving(false);

    if (initialIndex !== null && initialTitle.trim()) {
      const signature = `${round.id}:${initialIndex}:${initialTitle
        .trim()
        .toLocaleLowerCase()}`;
      lastSubmitted.current = signature;
      setSaved(true);
    } else {
      lastSubmitted.current = '';
      setSaved(false);
    }
  }, [state?.round]);

  useEffect(() => {
    if (state?.round?.status === 'revealed' && revealed.current !== state.round.id) {
      revealed.current = state.round.id;
      const answer = state.round.my_answer;
      const fullHit = Boolean(answer?.is_exact && answer?.title_correct);

      if (fullHit) {
        playTone('success');
        confetti({ particleCount: 100, spread: 75, origin: { y: 0.62 } });
      } else if (answer?.is_exact || answer?.title_correct) {
        playTone('scan');
      } else {
        playTone('fail');
      }
    }
  }, [state?.round]);

  useEffect(() => {
    const round = state?.round;
    const cleanTitle = titleGuess.trim();

    if (
      !round ||
      round.status !== 'answering' ||
      seconds <= 0 ||
      selected === null ||
      cleanTitle.length === 0
    ) {
      return;
    }

    const signature = `${round.id}:${selected}:${cleanTitle.toLocaleLowerCase()}`;
    if (lastSubmitted.current === signature) {
      setSaved(true);
      return;
    }

    setSaved(false);
    const timer = window.setTimeout(async () => {
      setSaving(true);
      setLocalError('');

      try {
        await apiFetch(`/api/games/${code}/answer`, {
          method: 'POST',
          body: JSON.stringify({ index: selected, titleGuess: cleanTitle })
        });
        lastSubmitted.current = signature;
        setSaved(true);
        await refresh();
      } catch (reason) {
        setLocalError(
          reason instanceof Error
            ? reason.message
            : 'No se pudo guardar la respuesta.'
        );
      } finally {
        setSaving(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [code, refresh, seconds, selected, state?.round, titleGuess]);

  async function ready() {
    if (!state?.me) return;
    setBusy(true);
    setLocalError('');

    try {
      await apiFetch(`/api/games/${code}/ready`, {
        method: 'POST',
        body: JSON.stringify({ ready: !state.me.ready })
      });
      await refresh();
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : 'No se pudo actualizar.'
      );
    } finally {
      setBusy(false);
    }
  }

  function place(index: number) {
    if (seconds <= 0 || state?.round?.status !== 'answering') return;
    setSelected(index);
    setSaved(false);
    playTone('click');
  }

  if (loading) return <MobileLoading />;
  if (error || !state || !state.me) {
    return <MobileError message={error || 'No eres parte de esta sala.'} />;
  }
  if (state.game.status === 'waiting') {
    return (
      <ReadyLobby
        state={state}
        busy={busy}
        error={localError}
        onReady={ready}
      />
    );
  }
  if (state.game.status === 'finished') return <MobileFinish state={state} />;

  const progress = state.game.time_limit
    ? Math.max(0, Math.min(100, (seconds / state.game.time_limit) * 100))
    : 0;

  const saveMessage = saving
    ? 'Guardando respuesta...'
    : saved
      ? 'Respuesta guardada automáticamente ✓'
      : selected === null
        ? 'Coloca la carta en la línea del tiempo.'
        : titleGuess.trim().length === 0
          ? 'Escribe el nombre de la canción.'
          : 'Tu respuesta se guardará automáticamente.';

  return (
    <div className="mobileGame" data-game-theme={state.game.theme}>
      <header className="mobileTop">
        <div>
          <small style={{ color: 'var(--muted)' }}>
            Ronda {state.game.current_round}/{state.game.total_rounds}
          </small>
          <div className="mobileScore">{state.me.score} pts</div>
        </div>
        <div
          className="timerRing"
          style={{ '--progress': progress } as React.CSSProperties}
        >
          <span>{state.round?.status === 'answering' ? seconds : '♪'}</span>
        </div>
        <div>
          <small style={{ color: 'var(--muted)' }}>Racha</small>
          <div className="mobileScore">
            <Flame size={17} color="var(--warning)" /> {state.me.streak}
          </div>
        </div>
      </header>

      {state.round?.status === 'waiting_scan' && (
        <section
          className="mobilePanel glass mobileStatus"
          style={{ marginTop: 'auto', marginBottom: 'auto' }}
        >
          <Radio size={34} color="var(--primary2)" />
          <h2>Prepárate para escuchar</h2>
          <p>
            El DJ está por escanear la siguiente canción. Tu carta aparecerá
            cuando empiece el contador.
          </p>
        </section>
      )}

      {state.round?.status === 'answering' && (
        <>
          <section className="mobilePanel glass titleGuessPanel">
            <h2>¿Qué canción es?</h2>
            <p>Escribe el título y luego colócala en el año correcto.</p>
            <input
              className="titleGuessInput"
              type="text"
              value={titleGuess}
              onChange={(event) => {
                setTitleGuess(event.target.value);
                setSaved(false);
              }}
              maxLength={120}
              autoComplete="off"
              placeholder="Nombre de la canción"
              aria-label="Nombre de la canción"
            />
            <small className={saved ? 'saveState saved' : 'saveState'}>
              {saveMessage}
            </small>
          </section>

          <section className="mobilePanel glass mobileStatus">
            <h2>¿En qué lugar va?</h2>
            <p>
              Arrastra la carta entre los años. Puedes cambiar ambas respuestas
              hasta que llegue a cero.
            </p>
          </section>

          <TimelineBoard
            cards={state.timeline}
            selected={selected}
            onPlace={place}
            locked={seconds <= 0}
          />
          {localError && <div className="errorBox">{localError}</div>}
        </>
      )}

      {state.round?.status === 'revealed' && <PlayerReveal state={state} />}
    </div>
  );
}

function ReadyLobby({
  state,
  busy,
  error,
  onReady
}: {
  state: NonNullable<ReturnType<typeof useGameState>['state']>;
  busy: boolean;
  error: string;
  onReady: () => void;
}) {
  return (
    <div className="mobileGame" data-game-theme={state.game.theme}>
      <section className="readyPanel glass">
        <div className="readyAvatar">{avatarEmoji(state.me!.avatar_id)}</div>
        <span className="eyebrow">Sala {state.game.code}</span>
        <h1>Hola, {state.me!.name}</h1>
        <p>
          Modo {formatMode(state.game.mode)} · {state.game.total_rounds} rondas ·{' '}
          {state.game.time_limit} segundos
        </p>
        <div style={{ padding: '16px 0', color: 'var(--muted)' }}>
          {state.me!.ready ? (
            <>
              <CheckCircle2 color="var(--success)" /> Estás listo. Esperando al
              resto...
            </>
          ) : (
            <>
              <LoaderCircle /> Confirma cuando estés preparado.
            </>
          )}
        </div>
        {error && (
          <div className="errorBox" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <Button
          className="buttonFull buttonBig"
          variant={state.me!.ready ? 'secondary' : 'primary'}
          onClick={onReady}
          disabled={busy}
        >
          {busy
            ? 'Sincronizando...'
            : state.me!.ready
              ? 'Ya no estoy listo'
              : 'Estoy listo'}
        </Button>
      </section>
    </div>
  );
}

function PlayerReveal({
  state
}: {
  state: NonNullable<ReturnType<typeof useGameState>['state']>;
}) {
  const answer = state.round?.my_answer;
  const song = state.round?.song;
  const yearCorrect = Boolean(answer?.is_exact);
  const titleCorrect = Boolean(answer?.title_correct);
  const fullHit = yearCorrect && titleCorrect;

  const headline = fullHit
    ? '¡Doble acierto!'
    : yearCorrect
      ? 'Año correcto'
      : titleCorrect
        ? 'Título correcto'
        : answer?.distance === 1
          ? 'Casi en el año'
          : answer?.distance === 2
            ? 'Estuviste cerca'
            : 'No fue esta vez';

  return (
    <section
      className="mobilePanel glass"
      style={{ margin: 'auto 0', textAlign: 'center', padding: 24 }}
    >
      {fullHit ? (
        <CheckCircle2 size={52} color="var(--success)" />
      ) : yearCorrect || titleCorrect ? (
        <Sparkles size={52} color="var(--warning)" />
      ) : (
        <XCircle size={52} color="var(--danger)" />
      )}

      <h1 style={{ fontSize: '2rem', margin: '10px 0 4px' }}>{headline}</h1>

      {song && (
        <>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
            {song.title} · {song.artist}
          </p>
          <div className="yearPill">{song.release_year}</div>
        </>
      )}

      <div className="answerBreakdown">
        <span className={yearCorrect ? 'correct' : 'wrong'}>
          Año {yearCorrect ? '✓' : '✗'} · +{answer?.base_score ?? 0}
        </span>
        <span className={titleCorrect ? 'correct' : 'wrong'}>
          Título {titleCorrect ? '✓' : '✗'} · +{answer?.title_score ?? 0}
        </span>
      </div>

      {answer?.title_guess && (
        <p className="yourGuess">Tu respuesta: “{answer.title_guess}”</p>
      )}

      <div style={{ fontSize: '2.4rem', fontWeight: 950, marginTop: 20 }}>
        +{answer?.total_score ?? 0}
      </div>
      {(answer?.streak_bonus ?? 0) > 0 && (
        <p style={{ color: 'var(--warning)' }}>
          Incluye +{answer!.streak_bonus} por racha
        </p>
      )}
      <p style={{ color: 'var(--muted)' }}>
        La siguiente ronda comienza automáticamente.
      </p>
    </section>
  );
}

function MobileFinish({
  state
}: {
  state: NonNullable<ReturnType<typeof useGameState>['state']>;
}) {
  const mine =
    state.results?.find((result) => result.user_id === state.me?.user_id) ||
    state.results?.find((result) => result.player_name === state.me?.name);

  return (
    <div
      className="mobileGame"
      data-game-theme={state.game.theme}
      style={{ justifyContent: 'center' }}
    >
      <section className="readyPanel glass">
        <Trophy size={62} color="var(--warning)" />
        <span className="eyebrow">Resultado final</span>
        <h1>Terminaste #{mine?.rank ?? '—'}</h1>
        <div style={{ fontSize: '3rem', fontWeight: 950 }}>
          {mine?.score ?? state.me?.score} pts
        </div>
        <p>
          {mine?.exact_hits ?? state.me?.exact_hits} aciertos exactos · mejor
          racha {mine?.max_streak ?? state.me?.max_streak}
        </p>
        <Button className="buttonFull" onClick={() => (location.href = '/')}>
          <Home /> Volver al inicio
        </Button>
      </section>
    </div>
  );
}

function MobileLoading() {
  return (
    <div className="mobileGame" style={{ display: 'grid', placeItems: 'center' }}>
      <LoaderCircle size={42} className="spin" />
    </div>
  );
}

function MobileError({ message }: { message: string }) {
  return (
    <div className="mobileGame" style={{ display: 'grid', placeItems: 'center' }}>
      <section className="readyPanel glass">
        <Music2 size={45} />
        <h1>No pudimos entrar</h1>
        <p>{message}</p>
        <Button className="buttonFull" onClick={() => (location.href = '/join')}>
          Volver a unirme
        </Button>
      </section>
    </div>
  );
}
