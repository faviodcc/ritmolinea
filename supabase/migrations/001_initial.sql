create extension if not exists pgcrypto;

create type public.game_status as enum ('waiting','playing','reveal','finished','abandoned');
create type public.round_status as enum ('waiting_scan','answering','revealed','closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_id text not null default 'pulse-fox',
  role text not null default 'user' check (role in ('user','admin')),
  theme text not null default 'neon-night',
  is_public boolean not null default true,
  games_played integer not null default 0,
  wins integer not null default 0,
  total_score bigint not null default 0,
  best_score integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  release_year smallint not null check (release_year between 1900 and 2100),
  decade smallint not null check (decade between 1900 and 2100),
  genre text not null,
  country text not null,
  spotify_url text not null check (spotify_url like 'https://open.spotify.com/track/%'),
  difficulty smallint not null default 2 check (difficulty between 1 and 5),
  image_url text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status public.game_status not null default 'waiting',
  mode text not null default 'random',
  current_round integer not null default 0,
  total_rounds integer not null default 15 check (total_rounds between 3 and 50),
  time_limit integer not null default 15 check (time_limit between 5 and 60),
  reveal_seconds integer not null default 5 check (reveal_seconds between 3 and 20),
  max_players integer not null default 12 check (max_players between 2 and 40),
  theme text not null default 'neon-night',
  scoring jsonb not null default '{"exact":100,"oneAway":70,"twoAway":40,"streakStep":20,"streakCap":60}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  avatar_id text not null,
  ready boolean not null default false,
  connected boolean not null default true,
  score integer not null default 0,
  streak integer not null default 0,
  max_streak integer not null default 0,
  exact_hits integer not null default 0,
  near_hits integer not null default 0,
  joined_at timestamptz not null default now(),
  unique(game_id, user_id)
);
create unique index game_players_unique_name on public.game_players(game_id, lower(name));

create table public.game_song_queue (
  game_id uuid not null references public.games(id) on delete cascade,
  position integer not null,
  song_id uuid not null references public.songs(id),
  primary key(game_id, position),
  unique(game_id, song_id)
);

create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  round_number integer not null,
  song_id uuid not null references public.songs(id),
  status public.round_status not null default 'waiting_scan',
  started_at timestamptz,
  answer_deadline timestamptz,
  resolved_at timestamptz,
  reveal_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique(game_id, round_number)
);

create table public.game_round_scan_tokens (
  round_id uuid primary key references public.game_rounds(id) on delete cascade,
  scan_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create or replace function public.create_round_scan_token() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.game_round_scan_tokens(round_id) values(new.id) on conflict(round_id) do nothing;
  return new;
end $$;
create trigger game_rounds_create_scan_token after insert on public.game_rounds
for each row execute function public.create_round_scan_token();

create table public.round_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  intended_index integer,
  submitted_at timestamptz,
  distance integer,
  base_score integer not null default 0,
  streak_bonus integer not null default 0,
  total_score integer not null default 0,
  is_exact boolean not null default false,
  is_late boolean not null default false,
  unique(round_id, player_id)
);

create table public.player_cards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  song_id uuid not null references public.songs(id),
  acquired_round integer not null default 0,
  created_at timestamptz not null default now(),
  unique(player_id, song_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  points integer not null default 0,
  rule jsonb not null default '{}'::jsonb
);

create table public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null,
  avatar_id text not null,
  score integer not null,
  exact_hits integer not null,
  max_streak integer not null,
  rank integer not null,
  created_at timestamptz not null default now(),
  unique(game_id, user_id)
);

create index games_code_idx on public.games(code);
create index players_game_idx on public.game_players(game_id);
create index rounds_game_idx on public.game_rounds(game_id, round_number desc);
create index answers_round_idx on public.round_answers(round_id);
create index cards_player_idx on public.player_cards(player_id);
create index songs_mode_idx on public.songs(is_active, genre, country, decade);
create index songs_tags_idx on public.songs using gin(tags);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger songs_touch before update on public.songs for each row execute function public.touch_updated_at();
create trigger games_touch before update on public.games for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values(new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Jugador')) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.start_game_by_code(p_code text) returns public.games
language plpgsql security definer set search_path = public as $$
declare v_game public.games; v_players int; v_starter uuid; v_round_song uuid;
begin
  select * into v_game from public.games where code = upper(p_code) for update;
  if not found then raise exception 'Partida no encontrada'; end if;
  if v_game.status <> 'waiting' then return v_game; end if;
  select count(*) into v_players from public.game_players where game_id=v_game.id;
  if v_players < 2 then raise exception 'Se necesitan al menos 2 jugadores'; end if;
  if exists(select 1 from public.game_players where game_id=v_game.id and ready=false) then raise exception 'Todos deben estar listos'; end if;
  select song_id into v_starter from public.game_song_queue where game_id=v_game.id and position=0;
  select song_id into v_round_song from public.game_song_queue where game_id=v_game.id and position=1;
  if v_starter is null or v_round_song is null then raise exception 'Cola de canciones incompleta'; end if;
  insert into public.player_cards(game_id,player_id,song_id,acquired_round)
    select v_game.id,id,v_starter,0 from public.game_players where game_id=v_game.id on conflict do nothing;
  insert into public.game_rounds(game_id,round_number,song_id) values(v_game.id,1,v_round_song) on conflict do nothing;
  update public.games set status='playing', current_round=1, started_at=now() where id=v_game.id returning * into v_game;
  return v_game;
end $$;

create or replace function public.mark_round_scanned(p_token uuid)
returns table(spotify_url text, game_code text)
language plpgsql security definer set search_path=public as $$
declare v_round public.game_rounds; v_game public.games; v_url text;
begin
  select gr.* into v_round
  from public.game_rounds gr
  join public.game_round_scan_tokens gst on gst.round_id=gr.id
  where gst.scan_token=p_token
  for update of gr;
  if not found then raise exception 'QR inválido'; end if;
  select * into v_game from public.games where id=v_round.game_id for update;
  if v_game.status<>'playing' or v_game.current_round<>v_round.round_number then raise exception 'Este QR ya no está activo'; end if;
  select s.spotify_url into v_url from public.songs s where s.id=v_round.song_id;
  if v_round.status='waiting_scan' then
    update public.game_rounds set status='answering', started_at=now(), answer_deadline=now()+make_interval(secs=>v_game.time_limit) where id=v_round.id;
  elsif v_round.status<>'answering' then
    raise exception 'Este QR ya no está activo';
  end if;
  return query select v_url, v_game.code;
end $$;

create or replace function public.submit_round_answer(p_code text, p_user_id uuid, p_index integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_game public.games; v_round public.game_rounds; v_player public.game_players; v_count int;
begin
  select * into v_game from public.games where code=upper(p_code);
  if not found or v_game.status<>'playing' then raise exception 'La ronda no está activa'; end if;
  select * into v_round from public.game_rounds where game_id=v_game.id and round_number=v_game.current_round for update;
  if v_round.status<>'answering' or now()>v_round.answer_deadline then raise exception 'Tiempo agotado'; end if;
  select * into v_player from public.game_players where game_id=v_game.id and user_id=p_user_id;
  if not found then raise exception 'Jugador no encontrado'; end if;
  select count(*) into v_count from public.player_cards where player_id=v_player.id;
  if p_index<0 or p_index>v_count then raise exception 'Posición inválida'; end if;
  insert into public.round_answers(round_id,player_id,intended_index,submitted_at)
  values(v_round.id,v_player.id,p_index,now())
  on conflict(round_id,player_id) do update set intended_index=excluded.intended_index, submitted_at=excluded.submitted_at;
  return true;
end $$;

create or replace function public.resolve_round_by_code(p_code text) returns boolean
language plpgsql security definer set search_path=public as $$
declare
  v_game public.games; v_round public.game_rounds; v_target_year int; v_player public.game_players;
  v_answer public.round_answers; v_lower int; v_upper int; v_distance int; v_base int; v_new_streak int; v_bonus int; v_exact bool;
begin
  select * into v_game from public.games where code=upper(p_code) for update;
  if not found then raise exception 'Partida no encontrada'; end if;
  select * into v_round from public.game_rounds where game_id=v_game.id and round_number=v_game.current_round for update;
  if v_round.status='revealed' or v_round.status='closed' then return true; end if;
  if v_round.status<>'answering' then raise exception 'La ronda no está respondiéndose'; end if;
  if now()<v_round.answer_deadline then raise exception 'La ronda todavía no termina'; end if;
  select release_year into v_target_year from public.songs where id=v_round.song_id;

  for v_player in select * from public.game_players where game_id=v_game.id for update loop
    select * into v_answer from public.round_answers where round_id=v_round.id and player_id=v_player.id;
    if not found then
      insert into public.round_answers(round_id,player_id,is_late) values(v_round.id,v_player.id,true) returning * into v_answer;
    end if;
    select count(*) filter(where s.release_year < v_target_year), count(*) filter(where s.release_year <= v_target_year)
      into v_lower,v_upper from public.player_cards pc join public.songs s on s.id=pc.song_id where pc.player_id=v_player.id;
    if v_answer.intended_index is null then v_distance:=999;
    elsif v_answer.intended_index between v_lower and v_upper then v_distance:=0;
    else v_distance:=least(abs(v_answer.intended_index-v_lower),abs(v_answer.intended_index-v_upper)); end if;
    v_exact := v_distance=0;
    v_base := case v_distance when 0 then coalesce((v_game.scoring->>'exact')::int,100) when 1 then coalesce((v_game.scoring->>'oneAway')::int,70) when 2 then coalesce((v_game.scoring->>'twoAway')::int,40) else 0 end;
    v_new_streak := case when v_exact then v_player.streak+1 else 0 end;
    v_bonus := case when v_exact then least(greatest(v_new_streak-1,0)*coalesce((v_game.scoring->>'streakStep')::int,20),coalesce((v_game.scoring->>'streakCap')::int,60)) else 0 end;
    update public.round_answers set distance=v_distance,base_score=v_base,streak_bonus=v_bonus,total_score=v_base+v_bonus,is_exact=v_exact where id=v_answer.id;
    update public.game_players set score=score+v_base+v_bonus,streak=v_new_streak,max_streak=greatest(max_streak,v_new_streak),exact_hits=exact_hits+(case when v_exact then 1 else 0 end),near_hits=near_hits+(case when v_distance in (1,2) then 1 else 0 end) where id=v_player.id;
    if v_exact then insert into public.player_cards(game_id,player_id,song_id,acquired_round) values(v_game.id,v_player.id,v_round.song_id,v_round.round_number) on conflict do nothing; end if;
  end loop;

  update public.game_rounds set status='revealed',resolved_at=now(),reveal_ends_at=now()+make_interval(secs=>v_game.reveal_seconds) where id=v_round.id;
  update public.games set status='reveal' where id=v_game.id;
  return true;
end $$;

create or replace function public.advance_game_by_code(p_code text) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_game public.games; v_round public.game_rounds; v_next_song uuid; v_next int;
begin
  select * into v_game from public.games where code=upper(p_code) for update;
  if not found then raise exception 'Partida no encontrada'; end if;
  select * into v_round from public.game_rounds where game_id=v_game.id and round_number=v_game.current_round for update;
  if v_round.status='closed' then return true; end if;
  if v_round.status<>'revealed' or now()<v_round.reveal_ends_at then raise exception 'La revelación sigue activa'; end if;
  update public.game_rounds set status='closed' where id=v_round.id;
  if v_game.current_round>=v_game.total_rounds then
    update public.games set status='finished',ended_at=now() where id=v_game.id;
    insert into public.game_results(game_id,user_id,player_name,avatar_id,score,exact_hits,max_streak,rank)
    select game_id,user_id,name,avatar_id,score,exact_hits,max_streak,
      row_number() over(order by score desc,exact_hits desc,max_streak desc,joined_at)::int
    from public.game_players where game_id=v_game.id
    on conflict(game_id,user_id) do update set score=excluded.score,exact_hits=excluded.exact_hits,max_streak=excluded.max_streak,rank=excluded.rank;
    update public.profiles p set games_played=p.games_played+1,total_score=p.total_score+r.score,best_score=greatest(p.best_score,r.score),best_streak=greatest(p.best_streak,r.max_streak),wins=p.wins+(case when r.rank=1 then 1 else 0 end)
      from public.game_results r where r.game_id=v_game.id and r.user_id=p.id;
    return true;
  end if;
  v_next:=v_game.current_round+1;
  select song_id into v_next_song from public.game_song_queue where game_id=v_game.id and position=v_next;
  if v_next_song is null then raise exception 'No hay canción siguiente'; end if;
  insert into public.game_rounds(game_id,round_number,song_id) values(v_game.id,v_next,v_next_song) on conflict do nothing;
  update public.games set status='playing',current_round=v_next where id=v_game.id;
  return true;
end $$;

insert into public.achievements(code,name,description,icon,points,rule) values
('FIRST_HIT','Primer latido','Coloca tu primera canción exactamente.','sparkles',50,'{"exact_hits":1}'),
('ON_FIRE','En llamas','Consigue una racha de 3 aciertos.','flame',100,'{"max_streak":3}'),
('TIME_TRAVELER','Viajero del tiempo','Consigue 5 aciertos exactos en una partida.','clock',150,'{"exact_hits":5}'),
('HEADLINER','Cabeza de cartel','Gana una partida.','trophy',250,'{"wins":1}')
on conflict(code) do nothing;

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.game_song_queue enable row level security;
alter table public.game_rounds enable row level security;
alter table public.game_round_scan_tokens enable row level security;
alter table public.round_answers enable row level security;
alter table public.player_cards enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;
alter table public.game_results enable row level security;

-- Helpers SECURITY DEFINER avoid recursive RLS checks between games and game_players.
create or replace function public.is_game_host(p_game_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.games where id=p_game_id and host_user_id=(select auth.uid()));
$$;
create or replace function public.is_game_member(p_game_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select public.is_game_host(p_game_id) or exists(select 1 from public.game_players where game_id=p_game_id and user_id=(select auth.uid()));
$$;
create or replace function public.owns_player(p_player_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.game_players where id=p_player_id and user_id=(select auth.uid()));
$$;
create or replace function public.is_round_host(p_round_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.game_rounds gr join public.games g on g.id=gr.game_id where gr.id=p_round_id and g.host_user_id=(select auth.uid()));
$$;
revoke all on function public.is_game_host(uuid) from public,anon;
revoke all on function public.is_game_member(uuid) from public,anon;
revoke all on function public.owns_player(uuid) from public,anon;
revoke all on function public.is_round_host(uuid) from public,anon;
grant execute on function public.is_game_host(uuid) to authenticated;
grant execute on function public.is_game_member(uuid) to authenticated;
grant execute on function public.owns_player(uuid) to authenticated;
grant execute on function public.is_round_host(uuid) to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or is_public);
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy songs_admin_read on public.songs for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy games_member_read on public.games for select to authenticated using (public.is_game_member(id));
create policy players_read on public.game_players for select to authenticated using (user_id=(select auth.uid()) or public.is_game_host(game_id));
create policy rounds_read on public.game_rounds for select to authenticated using (public.is_game_member(game_id));
create policy answers_read on public.round_answers for select to authenticated using (public.owns_player(player_id) or public.is_round_host(round_id));
create policy cards_read on public.player_cards for select to authenticated using (public.owns_player(player_id) or public.is_game_host(game_id));
create policy achievements_read on public.achievements for select to authenticated using(true);
create policy player_achievements_read on public.player_achievements for select to authenticated using(user_id=(select auth.uid()));
create policy results_read on public.game_results for select to authenticated
using(user_id=(select auth.uid()) or public.is_game_member(game_id) or exists(select 1 from public.profiles p where p.id=user_id and p.is_public));

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_players;
alter publication supabase_realtime add table public.game_rounds;
alter publication supabase_realtime add table public.round_answers;
alter publication supabase_realtime add table public.player_cards;

revoke all on function public.start_game_by_code(text) from public,anon,authenticated;
revoke all on function public.mark_round_scanned(uuid) from public,anon,authenticated;
revoke all on function public.submit_round_answer(text,uuid,integer) from public,anon,authenticated;
revoke all on function public.resolve_round_by_code(text) from public,anon,authenticated;
revoke all on function public.advance_game_by_code(text) from public,anon,authenticated;
grant execute on function public.start_game_by_code(text) to service_role;
grant execute on function public.mark_round_scanned(uuid) to service_role;
grant execute on function public.submit_round_answer(text,uuid,integer) to service_role;
grant execute on function public.resolve_round_by_code(text) to service_role;
grant execute on function public.advance_game_by_code(text) to service_role;
