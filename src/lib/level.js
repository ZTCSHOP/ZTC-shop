// XP & niveaux : calculés depuis l'activité réelle (pas de stockage nécessaire)
// +100 / commande, +50 / inscription tournoi, +30 / équipe créée, +20 / demande acceptée
export const xpForActivity = ({ orders = 0, regs = 0, teams = 0, accepted = 0 } = {}) =>
  orders * 100 + regs * 50 + teams * 30 + accepted * 20

// Palier : niveau n demande n*250 XP cumulés (1:0, 2:250, 3:750, 4:1500, 5:2500...)
export const xpNeededFor = (level) => ((level - 1) * level * 250) / 2

export const levelFor = (xp) => {
  let lvl = 1
  while (xp >= xpNeededFor(lvl + 1)) lvl++
  return lvl
}

export const levelProgress = (xp) => {
  const lvl = levelFor(xp)
  const cur = xpNeededFor(lvl), next = xpNeededFor(lvl + 1)
  return { level: lvl, cur: xp - cur, need: next - cur }
}
