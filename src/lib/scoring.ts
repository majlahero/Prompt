export interface ScoreBreakdown {
  totalPoints: number;
  timeBonus: number;
  triesBonus: number;
  cleanSolveBonus: number;
  hintPenalty: number;
}

export function calculateScore(
  basePoints: number,
  timeTaken: number,
  tries: number,
  hintsUsed: number,
  _totalHints: number
): ScoreBreakdown {
  const timeBonus = timeTaken < 60 ? 50 : timeTaken < 120 ? 30 : timeTaken < 300 ? 10 : 0;
  const triesBonus = tries <= 3 ? 40 : tries <= 5 ? 20 : tries <= 10 ? 10 : 0;
  const cleanSolveBonus = hintsUsed === 0 ? 100 : 0;
  const hintPenalty = hintsUsed * 50;

  const totalPoints = Math.max(0, basePoints + timeBonus + triesBonus + cleanSolveBonus - hintPenalty);

  return { totalPoints, timeBonus, triesBonus, cleanSolveBonus, hintPenalty };
}
