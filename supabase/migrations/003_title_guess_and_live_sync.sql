-- RitmoLínea 1.1
-- Añade la adivinanza del título y conserva la puntuación de la línea temporal.
-- Título correcto: +50 puntos adicionales.

alter table public.round_answers
  add column if not exists title_guess text,
  add column if not exists title_correct boolean not null default false,
  add column if not exists title_score integer not null default 0;

create or replace function public.normalize_song_title(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(p_value, ''),
            'áéíóúüñÁÉÍÓÚÜÑ',
            'aeiouunAEIOUUN'
          )
        ),
        '\([^)]*\)|\[[^]]*\]',
        ' ',
        'g'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

revoke all on function public.normalize_song_title(text) from public, anon;
grant execute on function public.normalize_song_title(text) to authenticated, service_role;

drop function if exists public.submit_round_answer(text, uuid, integer);

create or replace function public.submit_round_answer(
  p_code text,
  p_user_id uuid,
  p_index integer,
  p_title_guess text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.games;
  v_round public.game_rounds;
  v_player public.game_players;
  v_count integer;
  v_guess text;
begin
  select * into v_game
  from public.games
  where code = upper(p_code);

  if not found or v_game.status <> 'playing' then
    raise exception 'La ronda no está activa';
  end if;

  select * into v_round
  from public.game_rounds
  where game_id = v_game.id
    and round_number = v_game.current_round
  for update;

  if v_round.status <> 'answering' or now() > v_round.answer_deadline then
    raise exception 'Tiempo agotado';
  end if;

  select * into v_player
  from public.game_players
  where game_id = v_game.id
    and user_id = p_user_id;

  if not found then
    raise exception 'Jugador no encontrado';
  end if;

  select count(*) into v_count
  from public.player_cards
  where player_id = v_player.id;

  if p_index < 0 or p_index > v_count then
    raise exception 'Posición inválida';
  end if;

  v_guess := nullif(trim(coalesce(p_title_guess, '')), '');
  if v_guess is null then
    raise exception 'Escribe el nombre de la canción';
  end if;

  insert into public.round_answers(
    round_id,
    player_id,
    intended_index,
    title_guess,
    submitted_at
  )
  values(
    v_round.id,
    v_player.id,
    p_index,
    v_guess,
    now()
  )
  on conflict(round_id, player_id) do update set
    intended_index = excluded.intended_index,
    title_guess = excluded.title_guess,
    submitted_at = excluded.submitted_at;

  return true;
end;
$$;

revoke all on function public.submit_round_answer(text, uuid, integer, text)
from public, anon, authenticated;
grant execute on function public.submit_round_answer(text, uuid, integer, text)
to service_role;

create or replace function public.resolve_round_by_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.games;
  v_round public.game_rounds;
  v_target_year integer;
  v_target_title text;
  v_target_normalized text;
  v_player public.game_players;
  v_answer public.round_answers;
  v_lower integer;
  v_upper integer;
  v_distance integer;
  v_base integer;
  v_new_streak integer;
  v_bonus integer;
  v_exact boolean;
  v_guess_normalized text;
  v_title_correct boolean;
  v_title_score integer;
begin
  select * into v_game
  from public.games
  where code = upper(p_code)
  for update;

  if not found then
    raise exception 'Partida no encontrada';
  end if;

  select * into v_round
  from public.game_rounds
  where game_id = v_game.id
    and round_number = v_game.current_round
  for update;

  if v_round.status in ('revealed', 'closed') then
    return true;
  end if;

  if v_round.status <> 'answering' then
    raise exception 'La ronda no está respondiéndose';
  end if;

  if now() < v_round.answer_deadline then
    raise exception 'La ronda todavía no termina';
  end if;

  select release_year, title
  into v_target_year, v_target_title
  from public.songs
  where id = v_round.song_id;

  v_target_normalized := public.normalize_song_title(v_target_title);

  for v_player in
    select *
    from public.game_players
    where game_id = v_game.id
    for update
  loop
    select * into v_answer
    from public.round_answers
    where round_id = v_round.id
      and player_id = v_player.id;

    if not found then
      insert into public.round_answers(round_id, player_id, is_late)
      values(v_round.id, v_player.id, true)
      returning * into v_answer;
    end if;

    select
      count(*) filter(where s.release_year < v_target_year),
      count(*) filter(where s.release_year <= v_target_year)
    into v_lower, v_upper
    from public.player_cards pc
    join public.songs s on s.id = pc.song_id
    where pc.player_id = v_player.id;

    if v_answer.intended_index is null then
      v_distance := 999;
    elsif v_answer.intended_index between v_lower and v_upper then
      v_distance := 0;
    else
      v_distance := least(
        abs(v_answer.intended_index - v_lower),
        abs(v_answer.intended_index - v_upper)
      );
    end if;

    v_exact := v_distance = 0;
    v_base := case v_distance
      when 0 then coalesce((v_game.scoring->>'exact')::integer, 100)
      when 1 then coalesce((v_game.scoring->>'oneAway')::integer, 70)
      when 2 then coalesce((v_game.scoring->>'twoAway')::integer, 40)
      else 0
    end;

    v_new_streak := case
      when v_exact then v_player.streak + 1
      else 0
    end;

    v_bonus := case
      when v_exact then least(
        greatest(v_new_streak - 1, 0) * coalesce((v_game.scoring->>'streakStep')::integer, 20),
        coalesce((v_game.scoring->>'streakCap')::integer, 60)
      )
      else 0
    end;

    v_guess_normalized := public.normalize_song_title(v_answer.title_guess);
    v_title_correct :=
      length(v_guess_normalized) > 0
      and (
        v_guess_normalized = v_target_normalized
        or (
          least(length(v_guess_normalized), length(v_target_normalized)) >= 5
          and (
            position(v_guess_normalized in v_target_normalized) > 0
            or position(v_target_normalized in v_guess_normalized) > 0
          )
        )
      );
    v_title_score := case when v_title_correct then 50 else 0 end;

    update public.round_answers
    set
      distance = v_distance,
      base_score = v_base,
      streak_bonus = v_bonus,
      title_correct = v_title_correct,
      title_score = v_title_score,
      total_score = v_base + v_bonus + v_title_score,
      is_exact = v_exact
    where id = v_answer.id;

    update public.game_players
    set
      score = score + v_base + v_bonus + v_title_score,
      streak = v_new_streak,
      max_streak = greatest(max_streak, v_new_streak),
      exact_hits = exact_hits + case when v_exact then 1 else 0 end,
      near_hits = near_hits + case when v_distance in (1, 2) then 1 else 0 end
    where id = v_player.id;

    if v_exact then
      insert into public.player_cards(game_id, player_id, song_id, acquired_round)
      values(v_game.id, v_player.id, v_round.song_id, v_round.round_number)
      on conflict do nothing;
    end if;
  end loop;

  update public.game_rounds
  set
    status = 'revealed',
    resolved_at = now(),
    reveal_ends_at = now() + make_interval(secs => v_game.reveal_seconds)
  where id = v_round.id;

  update public.games
  set status = 'reveal'
  where id = v_game.id;

  return true;
end;
$$;

revoke all on function public.resolve_round_by_code(text)
from public, anon, authenticated;
grant execute on function public.resolve_round_by_code(text)
to service_role;

-- Actualiza la caché de funciones de la API de Supabase.
notify pgrst, 'reload schema';
