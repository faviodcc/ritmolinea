-- RitmoLínea 1.2
-- Inicio manual, validación flexible del título, corrección de selección móvil
-- y ampliación de la biblioteca con música mayormente latina.

create extension if not exists pg_trgm;

-- El juego deja de incluir canciones de anime en partidas nuevas.
update public.songs
set is_active = false
where country = 'Japón'
   or 'anime' = any(tags);

-- 57 canciones latinas adicionales. Se puede ejecutar varias veces sin duplicar.
with payload as (
  select *
  from jsonb_to_recordset($songs$[{"title": "Danza Kuduro", "artist": "Don Omar, Lucenzo", "release_year": 2010, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/2a1o6ZejUi8U3wzzOtCOYw", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "party"], "is_active": true}, {"title": "Propuesta Indecente", "artist": "Romeo Santos", "release_year": 2013, "decade": 2010, "genre": "Bachata", "country": "República Dominicana", "spotify_url": "https://open.spotify.com/track/5PycBIeabfvX3n9ILG7Vrv", "difficulty": 2, "image_url": null, "tags": ["latino", "bachata"], "is_active": true}, {"title": "Obsesión", "artist": "Aventura", "release_year": 2002, "decade": 2000, "genre": "Bachata", "country": "República Dominicana", "spotify_url": "https://open.spotify.com/track/65H6t1WQBim6q93yM8fEwn", "difficulty": 1, "image_url": null, "tags": ["latino", "bachata", "band"], "is_active": true}, {"title": "Persiana Americana", "artist": "Soda Stereo", "release_year": 1986, "decade": 1980, "genre": "Rock Latino", "country": "Argentina", "spotify_url": "https://open.spotify.com/track/57GgptBE1aWcVn83dWVjU1", "difficulty": 2, "image_url": null, "tags": ["latino", "rock", "band"], "is_active": true}, {"title": "Rayando el Sol", "artist": "Maná", "release_year": 1990, "decade": 1990, "genre": "Rock Latino", "country": "México", "spotify_url": "https://open.spotify.com/track/4Ofg5uuH7qqDIXpAJMpXZV", "difficulty": 1, "image_url": null, "tags": ["latino", "rock", "band"], "is_active": true}, {"title": "Suavemente", "artist": "Elvis Crespo", "release_year": 1998, "decade": 1990, "genre": "Merengue", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/1YwPNemawMgGe6sF4U0FTE", "difficulty": 1, "image_url": null, "tags": ["latino", "party"], "is_active": true}, {"title": "La Vida Es un Carnaval", "artist": "Celia Cruz", "release_year": 1998, "decade": 1990, "genre": "Salsa", "country": "Cuba", "spotify_url": "https://open.spotify.com/track/3zoYQLfNEvJ7UvQ4em2vsT", "difficulty": 1, "image_url": null, "tags": ["latino", "salsa", "women"], "is_active": true}, {"title": "Nunca Es Suficiente", "artist": "Los Ángeles Azules, Natalia Lafourcade", "release_year": 2018, "decade": 2010, "genre": "Cumbia", "country": "México", "spotify_url": "https://open.spotify.com/track/0HlMshB5JmZjPNbOuOgFHN", "difficulty": 2, "image_url": null, "tags": ["latino", "cumbia", "band", "women"], "is_active": true}, {"title": "Robarte un Beso", "artist": "Carlos Vives, Sebastián Yatra", "release_year": 2017, "decade": 2010, "genre": "Pop Latino", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/0JcNysfWVWaMS7R6vzGB2k", "difficulty": 1, "image_url": null, "tags": ["latino", "pop"], "is_active": true}, {"title": "Mayores", "artist": "Becky G, Bad Bunny", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Estados Unidos", "spotify_url": "https://open.spotify.com/track/7JNh1cfm0eXjqFVOzKLyau", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "women"], "is_active": true}, {"title": "Sin Pijama", "artist": "Becky G, Natti Natasha", "release_year": 2018, "decade": 2010, "genre": "Reggaetón", "country": "Estados Unidos", "spotify_url": "https://open.spotify.com/track/2ijef6ni2amuunRoKTlgww", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "women"], "is_active": true}, {"title": "Criminal", "artist": "Natti Natasha, Ozuna", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "República Dominicana", "spotify_url": "https://open.spotify.com/track/6Za3190Sbw39BBC77WSS1C", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton", "women"], "is_active": true}, {"title": "Se Preparó", "artist": "Ozuna", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/1m69ELEgE6k5ZWsap40ozt", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Callaíta", "artist": "Bad Bunny, Tainy", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/2TH65lNHgvLxCKXM3apjxI", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Vivir Mi Vida", "artist": "Marc Anthony", "release_year": 2013, "decade": 2010, "genre": "Salsa", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3QHMxEOAGD51PDlbFPHLyJ", "difficulty": 1, "image_url": null, "tags": ["latino", "salsa", "party"], "is_active": true}, {"title": "Felices los 4", "artist": "Maluma", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/0qYTZCo5Bwh1nsUFGZP3zn", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Chantaje", "artist": "Shakira, Maluma", "release_year": 2016, "decade": 2010, "genre": "Pop Latino", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/1WniHvhq9zTkny0WvGXX8o", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "women"], "is_active": true}, {"title": "La Bicicleta", "artist": "Carlos Vives, Shakira", "release_year": 2016, "decade": 2010, "genre": "Vallenato Pop", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/0sXvAOmXgjR2QUqLK1MltU", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "women"], "is_active": true}, {"title": "Waka Waka", "artist": "Shakira", "release_year": 2010, "decade": 2010, "genre": "Pop Latino", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/2Cd9iWfcOpGDHLz6tVA3G4", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "women", "party"], "is_active": true}, {"title": "Súbeme la Radio", "artist": "Enrique Iglesias, Descemer Bueno, Zion & Lennox", "release_year": 2017, "decade": 2010, "genre": "Pop Latino", "country": "España", "spotify_url": "https://open.spotify.com/track/7nKBxz47S9SD79N086fuhn", "difficulty": 2, "image_url": null, "tags": ["latino", "pop", "reggaeton"], "is_active": true}, {"title": "La Gozadera", "artist": "Gente de Zona, Marc Anthony", "release_year": 2015, "decade": 2010, "genre": "Salsa Urbana", "country": "Cuba", "spotify_url": "https://open.spotify.com/track/3ip2477VESffCtFkPFT0ov", "difficulty": 1, "image_url": null, "tags": ["latino", "salsa", "party", "band"], "is_active": true}, {"title": "Pobre Diabla", "artist": "Don Omar", "release_year": 2003, "decade": 2000, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/26RZ3DhnVlytdG6N1oxW1E", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Ella y Yo", "artist": "Aventura, Don Omar", "release_year": 2005, "decade": 2000, "genre": "Bachata", "country": "República Dominicana", "spotify_url": "https://open.spotify.com/track/1so3Diwy9pt9q6lHWINlfX", "difficulty": 1, "image_url": null, "tags": ["latino", "bachata", "band"], "is_active": true}, {"title": "Andar Conmigo", "artist": "Julieta Venegas", "release_year": 2003, "decade": 2000, "genre": "Pop Latino", "country": "México", "spotify_url": "https://open.spotify.com/track/05iMQqncVBIm4AE26EvaTL", "difficulty": 2, "image_url": null, "tags": ["latino", "pop", "women"], "is_active": true}, {"title": "La Rebelión", "artist": "Joe Arroyo", "release_year": 1986, "decade": 1980, "genre": "Salsa", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/00Ro1lnV3V6i87aY4t8Q43", "difficulty": 2, "image_url": null, "tags": ["latino", "salsa"], "is_active": true}, {"title": "Con Altura", "artist": "ROSALÍA, J Balvin, El Guincho", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "España", "spotify_url": "https://open.spotify.com/track/2qG5sZ7Si6sdK74qLxedYM", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "women", "tiktok"], "is_active": true}, {"title": "Síguelo Bailando", "artist": "Ozuna", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/5Y9fnynLlIvqtM710MHzfz", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Baila Baila Baila", "artist": "Ozuna", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/7uH27oIt4a6cIFCA8ZPcyG", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "party"], "is_active": true}, {"title": "China", "artist": "Anuel AA, Daddy Yankee, KAROL G, Ozuna, J Balvin", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/2ksOAxtIxY8yElEWw8RhgK", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "women"], "is_active": true}, {"title": "Adicto", "artist": "Tainy, Anuel AA, Ozuna", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3jbT1Y5MoPwEIpZndDDwVq", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Otro Trago", "artist": "Sech, Darell", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Panamá", "spotify_url": "https://open.spotify.com/track/1Ej96GIBCTvgH7tNX1r3qr", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Te Boté - Remix", "artist": "Nio García, Casper Mágico, Bad Bunny, Darell, Ozuna, Nicky Jam", "release_year": 2018, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3V8UKqhEK5zBkBb6d6ub8i", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "X", "artist": "Nicky Jam, J Balvin", "release_year": 2018, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/39N9RPD9MRb5WmoLzNzPeA", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "El Amante", "artist": "Nicky Jam", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3umS4y3uQDkqekNjVpiRUs", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Travesuras", "artist": "Nicky Jam", "release_year": 2014, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/1PtL0YQRtq3qxDGUSwZPJ5", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Hasta el Amanecer", "artist": "Nicky Jam", "release_year": 2016, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/4wFHfY9IILHLNwakPuFogD", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Ay Vamos", "artist": "J Balvin", "release_year": 2014, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/6j8JZ34YSJ3Yf7r2n2IPCX", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Ginza", "artist": "J Balvin", "release_year": 2015, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/7a6GeFdPlbQtd7BwVlZ52k", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Safari", "artist": "J Balvin, Pharrell Williams, BIA, Sky", "release_year": 2016, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/456xBIOmLRoLzCvCzZrWge", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Reggaetón Lento", "artist": "CNCO", "release_year": 2016, "decade": 2010, "genre": "Pop Latino", "country": "Latinoamérica", "spotify_url": "https://open.spotify.com/track/3AEZUABDXNtecAOSC1qTfo", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "reggaeton", "band"], "is_active": true}, {"title": "Hey DJ", "artist": "CNCO", "release_year": 2017, "decade": 2010, "genre": "Pop Latino", "country": "Latinoamérica", "spotify_url": "https://open.spotify.com/track/209gZgcfLq2aUuu51vOWBl", "difficulty": 2, "image_url": null, "tags": ["latino", "pop", "band"], "is_active": true}, {"title": "Mamita", "artist": "CNCO", "release_year": 2018, "decade": 2010, "genre": "Pop Latino", "country": "Latinoamérica", "spotify_url": "https://open.spotify.com/track/71GAvRsilpo9pqd0vYn8Mo", "difficulty": 2, "image_url": null, "tags": ["latino", "pop", "band"], "is_active": true}, {"title": "Calma - Remix", "artist": "Pedro Capó, Farruko", "release_year": 2018, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/5iwz1NiezX7WWjnCgY5TH4", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton", "party"], "is_active": true}, {"title": "Échame la Culpa", "artist": "Luis Fonsi, Demi Lovato", "release_year": 2017, "decade": 2010, "genre": "Pop Latino", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/2hl6q70unbviGo3g1R7uFx", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "women"], "is_active": true}, {"title": "Vente Pa' Ca", "artist": "Ricky Martin, Maluma", "release_year": 2016, "decade": 2010, "genre": "Pop Latino", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/7DM4BPaS7uofFul3ywMe46", "difficulty": 2, "image_url": null, "tags": ["latino", "pop"], "is_active": true}, {"title": "La Mordidita", "artist": "Ricky Martin, Yotuel", "release_year": 2015, "decade": 2010, "genre": "Pop Latino", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/00i0O74dXdaKKdCrqHnfXm", "difficulty": 2, "image_url": null, "tags": ["latino", "pop", "party"], "is_active": true}, {"title": "Corazón", "artist": "Maluma, Nego do Borel", "release_year": 2017, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/4lESS6vuruP6a79KWRaQou", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "HP", "artist": "Maluma", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/31UjYv5vLsDkzchJOtUMtW", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "11 PM", "artist": "Maluma", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/7KbF6AdprOXEEHlsq11Z6d", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Taki Taki", "artist": "DJ Snake, Selena Gomez, Ozuna, Cardi B", "release_year": 2018, "decade": 2010, "genre": "Pop Urbano", "country": "Latinoamérica", "spotify_url": "https://open.spotify.com/track/4w8niZpiMy6qz1mntFA5uM", "difficulty": 1, "image_url": null, "tags": ["latino", "pop", "reggaeton", "women", "tiktok"], "is_active": true}, {"title": "No Me Conoce - Remix", "artist": "Jhayco, J Balvin, Bad Bunny", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/7rknFhrVDyxzTJkPSf7LoW", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Soltera - Remix", "artist": "Lunay, Daddy Yankee, Bad Bunny", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/1c0hsvHLELX6y8qymnpLKL", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Otro Trago - Remix", "artist": "Sech, Darell, Nicky Jam, Ozuna, Anuel AA", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Panamá", "spotify_url": "https://open.spotify.com/track/4bTZeO72FwMa6wKOiqoynL", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "QUÉ PRETENDES", "artist": "J Balvin, Bad Bunny", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/25ZAibhr3bdlMCLmubZDVt", "difficulty": 2, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "LA CANCIÓN", "artist": "J Balvin, Bad Bunny", "release_year": 2019, "decade": 2010, "genre": "Reggaetón", "country": "Colombia", "spotify_url": "https://open.spotify.com/track/0fea68AdmYNygeTGI4RC18", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "MIA", "artist": "Bad Bunny, Drake", "release_year": 2018, "decade": 2010, "genre": "Reggaetón", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3gE4eQH3K83Sght0ZLvuBK", "difficulty": 1, "image_url": null, "tags": ["latino", "reggaeton"], "is_active": true}, {"title": "Amorfoda", "artist": "Bad Bunny", "release_year": 2018, "decade": 2010, "genre": "Latin Trap", "country": "Puerto Rico", "spotify_url": "https://open.spotify.com/track/3ITvHA9zhZZdBJsOsAUegF", "difficulty": 2, "image_url": null, "tags": ["latino", "trap"], "is_active": true}]$songs$::jsonb) as x(
    title text,
    artist text,
    release_year integer,
    decade integer,
    genre text,
    country text,
    spotify_url text,
    difficulty integer,
    image_url text,
    tags text[],
    is_active boolean
  )
)
insert into public.songs(
  title,
  artist,
  release_year,
  decade,
  genre,
  country,
  spotify_url,
  difficulty,
  image_url,
  tags,
  is_active
)
select
  title,
  artist,
  release_year,
  decade,
  genre,
  country,
  spotify_url,
  difficulty,
  image_url,
  tags,
  is_active
from payload
on conflict(spotify_url) do update set
  title = excluded.title,
  artist = excluded.artist,
  release_year = excluded.release_year,
  decade = excluded.decade,
  genre = excluded.genre,
  country = excluded.country,
  difficulty = excluded.difficulty,
  tags = excluded.tags,
  is_active = excluded.is_active;

-- Limpia acentos, signos y descripciones de versión.
create or replace function public.normalize_song_title(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(
    regexp_replace(
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
        '\s*[-–—]\s*(remix|version|versión|live|en vivo|radio edit|mtv unplugged|remaster|remastered).*$',
        ' ',
        'gi'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.song_title_matches(
  p_guess text,
  p_title text
)
returns boolean
language sql
immutable
set search_path = public
as $$
  with normalized as (
    select
      public.normalize_song_title(p_guess) as guess,
      public.normalize_song_title(p_title) as title
  )
  select
    length(guess) > 0
    and (
      guess = title
      or (
        least(length(guess), length(title)) >= 4
        and (
          position(guess in title) > 0
          or position(title in guess) > 0
        )
      )
      or (
        least(length(guess), length(title)) >= 5
        and similarity(guess, title) >= 0.52
      )
    )
  from normalized;
$$;

revoke all on function public.normalize_song_title(text)
from public, anon;
grant execute on function public.normalize_song_title(text)
to authenticated, service_role;

revoke all on function public.song_title_matches(text, text)
from public, anon;
grant execute on function public.song_title_matches(text, text)
to authenticated, service_role;

-- El anfitrión decide cuándo iniciar. Ya no comienza automáticamente al marcarse listos.
create or replace function public.start_game_by_code(p_code text)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.games;
  v_players integer;
  v_starter uuid;
  v_round_song uuid;
begin
  select * into v_game
  from public.games
  where code = upper(p_code)
  for update;

  if not found then
    raise exception 'Partida no encontrada';
  end if;

  if v_game.status <> 'waiting' then
    return v_game;
  end if;

  select count(*) into v_players
  from public.game_players
  where game_id = v_game.id;

  if v_players < 2 then
    raise exception 'Se necesitan al menos 2 jugadores';
  end if;

  select song_id into v_starter
  from public.game_song_queue
  where game_id = v_game.id and position = 0;

  select song_id into v_round_song
  from public.game_song_queue
  where game_id = v_game.id and position = 1;

  if v_starter is null or v_round_song is null then
    raise exception 'Cola de canciones incompleta';
  end if;

  insert into public.player_cards(game_id, player_id, song_id, acquired_round)
  select v_game.id, id, v_starter, 0
  from public.game_players
  where game_id = v_game.id
  on conflict do nothing;

  insert into public.game_rounds(game_id, round_number, song_id)
  values(v_game.id, 1, v_round_song)
  on conflict do nothing;

  update public.games
  set status = 'playing', current_round = 1, started_at = now()
  where id = v_game.id
  returning * into v_game;

  return v_game;
end;
$$;

revoke all on function public.start_game_by_code(text)
from public, anon, authenticated;
grant execute on function public.start_game_by_code(text)
to service_role;

-- Valida nuevamente posición y título al cerrar la ronda.
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
  v_player public.game_players;
  v_answer public.round_answers;
  v_lower integer;
  v_upper integer;
  v_distance integer;
  v_base integer;
  v_new_streak integer;
  v_bonus integer;
  v_exact boolean;
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

    -- Las cartas están ordenadas ascendentemente en el celular. Si hay canciones
    -- del mismo año, cualquier espacio dentro del bloque de ese año es correcto.
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
        greatest(v_new_streak - 1, 0)
          * coalesce((v_game.scoring->>'streakStep')::integer, 20),
        coalesce((v_game.scoring->>'streakCap')::integer, 60)
      )
      else 0
    end;

    -- Solo se compara contra el título de la canción. El artista nunca es obligatorio.
    v_title_correct := public.song_title_matches(
      v_answer.title_guess,
      v_target_title
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

notify pgrst, 'reload schema';
