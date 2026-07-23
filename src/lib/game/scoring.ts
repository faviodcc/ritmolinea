export type ScoringConfig = {
  exact: number;
  oneAway: number;
  twoAway: number;
  streakStep: number;
  streakCap: number;
};

export const DEFAULT_SCORING: ScoringConfig = {
  exact: 100,
  oneAway: 70,
  twoAway: 40,
  streakStep: 20,
  streakCap: 60
};

export function scorePlacement(distance: number, nextStreak: number, config = DEFAULT_SCORING) {
  const base = distance === 0 ? config.exact : distance === 1 ? config.oneAway : distance === 2 ? config.twoAway : 0;
  const streakBonus = distance === 0 ? Math.min(Math.max(nextStreak - 1, 0) * config.streakStep, config.streakCap) : 0;
  return { base, streakBonus, total: base + streakBonus };
}

export function placementDistance(index: number, lowerValidIndex: number, upperValidIndex: number) {
  if (index >= lowerValidIndex && index <= upperValidIndex) return 0;
  return Math.min(Math.abs(index - lowerValidIndex), Math.abs(index - upperValidIndex));
}
