import type { Song } from '@/types/game';

const LATIN_COUNTRIES = new Set([
  'perú',
  'peru',
  'colombia',
  'argentina',
  'méxico',
  'mexico',
  'puerto rico',
  'chile',
  'venezuela',
  'república dominicana',
  'republica dominicana',
  'panamá',
  'panama',
  'cuba',
  'españa',
  'uruguay',
  'ecuador',
  'brasil'
]);

export function isLatinSong(song: Song) {
  const country = song.country.toLowerCase();
  const tags = song.tags.map((tag) => tag.toLowerCase());
  const genre = song.genre.toLowerCase();

  return (
    tags.includes('latino') ||
    tags.includes('latin') ||
    LATIN_COUNTRIES.has(country) ||
    genre.includes('latino') ||
    genre.includes('reggaet') ||
    genre.includes('bachata') ||
    genre.includes('salsa') ||
    genre.includes('cumbia') ||
    genre.includes('vallenato')
  );
}

export function songMatchesMode(song: Song, mode: string) {
  const genre = song.genre.toLowerCase();
  const country = song.country.toLowerCase();
  const tags = song.tags.map((tag) => tag.toLowerCase());

  switch (mode) {
    case 'reggaeton':
      return genre.includes('reggaet');
    case 'rock':
      return genre.includes('rock');
    case 'pop':
      return genre.includes('pop');
    case 'peru':
      return country === 'perú' || country === 'peru';
    case 'latino':
      return isLatinSong(song);
    case 'tiktok':
      return tags.includes('tiktok');
    case 'disney':
      return tags.includes('disney');
    case 'anime':
      return false;
    case '90s':
      return song.decade === 1990;
    case '2000s':
      return song.decade === 2000;
    case '2010s':
      return song.decade === 2010;
    case 'women':
      return tags.includes('women') || tags.includes('female');
    case 'bands':
      return tags.includes('band');
    case 'classic':
      return song.difficulty <= 3;
    default:
      return true;
  }
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildSongQueue(songs: Song[], mode: string, amount: number) {
  const eligible = shuffle(songs.filter((song) => songMatchesMode(song, mode)));

  if (!['classic', 'random'].includes(mode)) return eligible.slice(0, amount);

  const latin = shuffle(eligible.filter(isLatinSong));
  const international = shuffle(eligible.filter((song) => !isLatinSong(song)));
  const latinTarget = Math.min(latin.length, Math.ceil(amount * 0.78));
  const internationalTarget = Math.min(
    international.length,
    amount - latinTarget
  );

  const chosen = [
    ...latin.slice(0, latinTarget),
    ...international.slice(0, internationalTarget)
  ];

  if (chosen.length < amount) {
    const chosenIds = new Set(chosen.map((song) => song.id));
    chosen.push(
      ...eligible
        .filter((song) => !chosenIds.has(song.id))
        .slice(0, amount - chosen.length)
    );
  }

  return shuffle(chosen).slice(0, amount);
}
