import fs from 'node:fs/promises';

const file = new URL('../data/songs.sample.json', import.meta.url);
const songs = JSON.parse(await fs.readFile(file, 'utf8'));
const errors = [];
const urls = new Set();
for (const [index, song] of songs.entries()) {
  const prefix = `Canción ${index + 1}`;
  for (const field of ['title','artist','release_year','decade','genre','country','spotify_url','difficulty','tags']) {
    if (song[field] === undefined || song[field] === null || song[field] === '') errors.push(`${prefix}: falta ${field}`);
  }
  if (!/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]+/.test(song.spotify_url ?? '')) errors.push(`${prefix}: Spotify URL inválida`);
  if (song.decade !== Math.floor(song.release_year / 10) * 10) errors.push(`${prefix}: década incorrecta`);
  if (song.difficulty < 1 || song.difficulty > 5) errors.push(`${prefix}: dificultad fuera de rango`);
  if (urls.has(song.spotify_url)) errors.push(`${prefix}: Spotify URL duplicada`);
  urls.add(song.spotify_url);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Biblioteca válida: ${songs.length} canciones, ${urls.size} enlaces únicos.`);
