-- Backfill para proyectos donde ya existían usuarios antes de aplicar el trigger de perfiles.
insert into public.profiles(id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', 'Jugador')
from auth.users
on conflict(id) do nothing;

create unique index if not exists songs_spotify_url_unique on public.songs(spotify_url);

create or replace function public.unlock_progress_achievements() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.exact_hits >= 1 then
    insert into public.player_achievements(user_id,achievement_id,game_id)
    select new.user_id,id,new.game_id from public.achievements where code='FIRST_HIT' on conflict(user_id,achievement_id) do nothing;
  end if;
  if new.max_streak >= 3 then
    insert into public.player_achievements(user_id,achievement_id,game_id)
    select new.user_id,id,new.game_id from public.achievements where code='ON_FIRE' on conflict(user_id,achievement_id) do nothing;
  end if;
  if new.exact_hits >= 5 then
    insert into public.player_achievements(user_id,achievement_id,game_id)
    select new.user_id,id,new.game_id from public.achievements where code='TIME_TRAVELER' on conflict(user_id,achievement_id) do nothing;
  end if;
  return new;
end $$;
create trigger game_players_unlock after update of exact_hits,max_streak on public.game_players for each row execute function public.unlock_progress_achievements();

create or replace function public.unlock_win_achievement() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.wins > old.wins then
    insert into public.player_achievements(user_id,achievement_id)
    select new.id,id from public.achievements where code='HEADLINER' on conflict(user_id,achievement_id) do nothing;
  end if;
  return new;
end $$;
create trigger profiles_unlock_win after update of wins on public.profiles for each row execute function public.unlock_win_achievement();

-- Limpieza recomendada para usuarios anónimos antiguos. Ejecútala con pg_cron en producción si tu plan lo permite.
create or replace function public.cleanup_old_anonymous_profiles(days_old integer default 30)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare deleted_count integer;
begin
  with deleted as (
    delete from auth.users where is_anonymous=true and created_at < now()-make_interval(days=>days_old) returning id
  ) select count(*) into deleted_count from deleted;
  return deleted_count;
end $$;
revoke all on function public.cleanup_old_anonymous_profiles(integer) from public,anon,authenticated;
grant execute on function public.cleanup_old_anonymous_profiles(integer) to service_role;

-- Portadas administradas por el servidor. La lectura es pública; las escrituras pasan por la API con service_role.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('song-covers', 'song-covers', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;
