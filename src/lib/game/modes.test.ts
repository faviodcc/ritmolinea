import { describe, expect, it } from 'vitest';
import { songMatchesMode } from './modes';
import type { Song } from '@/types/game';

const base: Song = {
  id: 'song', title: 'Demo', artist: 'Demo', release_year: 2019, decade: 2010,
  genre: 'Pop', country: 'Perú', spotify_url: 'https://open.spotify.com/track/demo',
  difficulty: 2, image_url: null, tags: ['latino', 'women'], is_active: true
};

describe('RitmoLínea mode filters', () => {
  it('matches country, decade and tag-based modes', () => {
    expect(songMatchesMode(base, 'peru')).toBe(true);
    expect(songMatchesMode(base, 'latino')).toBe(true);
    expect(songMatchesMode(base, 'women')).toBe(true);
    expect(songMatchesMode(base, '2010s')).toBe(true);
    expect(songMatchesMode(base, 'anime')).toBe(false);
  });
});
