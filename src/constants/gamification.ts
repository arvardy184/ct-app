
export const ACTIVITY_XP_BAB7: Record<string, number> = {
  'ap-k7-02': 80,
  'ap-k7-03': 110,
  'ap-k7-04': 140,
  'ap-k7-08': 170,
  'ap-k7-08-u': 170,
}

export function xpToLevel(totalXp: number): 1 | 2 | 3 | 4 | 5 {
  const xp = Math.max(0, totalXp)
  if (xp >= 400) return 5
  if (xp >= 300) return 4
  if (xp >= 200) return 3
  if (xp >= 75) return 2
  return 1
}
