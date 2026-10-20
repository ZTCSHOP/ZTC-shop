// XP & niveaux — système de progression ZTC
// 1 000 XP par niveau (niveau = floor(xp / 1000) + 1)
export const LEVEL_STEP = 1000

// Barème (côté serveur aussi, dans award_xp)
export const XP_ACTIONS = {
  tournament_reg: 100,
  team_create:    250,
  avatar_update:  20,
  checkin:        150,
  referral:       50,
  purchase:       1000,
  wallet_topup:   2500,
}

// Palier XP cumulé pour atteindre un niveau (niveau 1 = 0 XP)
export const xpNeededFor = (level) => Math.max(0, level - 1) * LEVEL_STEP

export const levelFor = (xp) => Math.floor(Math.max(0, Number(xp) || 0) / LEVEL_STEP) + 1

// Progression DANS le niveau courant
export const levelProgress = (xp) => {
  const total = Math.max(0, Number(xp) || 0)
  const level = levelFor(total)
  const cur = total % LEVEL_STEP
  return { level, cur, need: LEVEL_STEP, total }
}

// Paliers cadeaux (réclamés par le joueur, validés par l'admin)
export const REWARDS = [
  { tier: 'xp_1000',  xp: 1000,  emoji: '🥉', key: 'rw_bronze' },
  { tier: 'xp_10000', xp: 10000, emoji: '🥈', key: 'rw_silver' },
  { tier: 'xp_20000', xp: 20000, emoji: '🥇', key: 'rw_gold' },
]

// Compatibilité : estimation locale (mode hors-ligne) — le vrai XP vient de profiles.xp
export const xpForActivity = ({ orders = 0, regs = 0, teams = 0, accepted = 0 } = {}) =>
  orders * 100 + regs * 100 + teams * 250 + accepted * 20
