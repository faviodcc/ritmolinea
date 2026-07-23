import type { Song } from '@/types/game';

export function songMatchesMode(song: Song, mode: string) {
  const genre = song.genre.toLowerCase();
  const country = song.country.toLowerCase();
  const tags = song.tags.map((tag) => tag.toLowerCase());
  switch (mode) {
    case 'reggaeton': return genre.includes('reggaet');
    case 'rock': return genre.includes('rock');
    case 'pop': return genre.includes('pop');
    case 'peru': return country === 'perú' || country === 'peru';
    case 'latino': return tags.includes('latino') || ['perú','peru','colombia','argentina','méxico','mexico','puerto rico','chile','venezuela','república dominicana'].includes(country);
    case 'tiktok': return tags.includes('tiktok');
    case 'disney': return tags.includes('disney');
    case 'anime': return tags.includes('anime');
    case '90s': return song.decade === 1990;
    case '2000s': return song.decade === 2000;
    case '2010s': return song.decade === 2010;
    case 'women': return tags.includes('women') || tags.includes('female');
    case 'bands': return tags.includes('band');
    case 'classic': return song.difficulty <= 3;
    default: return true;
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
