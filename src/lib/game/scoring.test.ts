import { describe, expect, it } from 'vitest';
import { placementDistance, scorePlacement } from './scoring';

describe('RitmoLínea scoring', () => {
  it('scores exact and streak bonuses', () => {
    expect(scorePlacement(0, 1)).toEqual({ base: 100, streakBonus: 0, total: 100 });
    expect(scorePlacement(0, 2).total).toBe(120);
    expect(scorePlacement(0, 4).total).toBe(160);
    expect(scorePlacement(0, 8).total).toBe(160);
  });
  it('scores near placements', () => {
    expect(scorePlacement(1, 0).total).toBe(70);
    expect(scorePlacement(2, 0).total).toBe(40);
    expect(scorePlacement(3, 0).total).toBe(0);
  });
  it('accepts any position inside a same-year range', () => {
    expect(placementDistance(2, 2, 4)).toBe(0);
    expect(placementDistance(5, 2, 4)).toBe(1);
  });
});
