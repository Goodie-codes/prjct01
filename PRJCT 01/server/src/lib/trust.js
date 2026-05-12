const LEVEL_RULES = [
  { level: 1, minimumReturns: 0, nextTarget: 3 },
  { level: 2, minimumReturns: 3, nextTarget: 6 },
  { level: 3, minimumReturns: 6, nextTarget: null }
];

const TIER_REQUIREMENTS = {
  low: 1,
  medium: 2,
  high: 3
};

export function getTrustProgress(completedRentals = 0) {
  const safeReturns = Math.max(0, Number(completedRentals) || 0);
  const rule = [...LEVEL_RULES].reverse().find((entry) => safeReturns >= entry.minimumReturns);

  if (!rule.nextTarget) {
    return {
      level: rule.level,
      completedRentals: safeReturns,
      progressToNextLevel: 100,
      returnsUntilNextLevel: 0
    };
  }

  const levelSpan = rule.nextTarget - rule.minimumReturns;
  const completedInLevel = safeReturns - rule.minimumReturns;

  return {
    level: rule.level,
    completedRentals: safeReturns,
    progressToNextLevel: Math.round((completedInLevel / levelSpan) * 100),
    returnsUntilNextLevel: rule.nextTarget - safeReturns
  };
}

export function canRentTier(userLevel, valueTier = "low") {
  const requiredLevel = TIER_REQUIREMENTS[valueTier] || 1;

  return {
    allowed: Number(userLevel) >= requiredLevel,
    requiredLevel
  };
}
