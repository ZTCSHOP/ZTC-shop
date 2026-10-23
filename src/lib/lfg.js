export const LFG_GAMES = [
  { id: 'valorant', label: 'Valorant', icon: '🎯' },
  { id: 'lol', label: 'League of Legends', icon: '⚔️' },
  { id: 'cs2', label: 'CS2', icon: '🔫' },
  { id: 'rocket', label: 'Rocket League', icon: '🚀' },
  { id: 'fortnite', label: 'Fortnite', icon: '🏗️' },
  { id: 'other', label: 'Autre', icon: '🎮' },
]

export const LFG_RANKS = {
  valorant: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
  lol: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  cs2: ['Silver', 'Gold Nova', 'MG', 'DMG', 'LE', 'LEM', 'Supreme', 'Global'],
  rocket: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'SSL'],
  fortnite: ['Débutant', 'Intermédiaire', 'Avancé', 'Pro'],
  other: ['Débutant', 'Intermédiaire', 'Avancé', 'Pro'],
}

export const LFG_ROLES = {
  valorant: ['Duelist', 'Initiateur', 'Contrôleur', 'Sentinelle', 'Flex'],
  lol: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  cs2: ['Entry', 'AWPer', 'IGL', 'Support', 'Lurker'],
  rocket: ['Attaquant', 'Milieu', 'Défenseur'],
  fortnite: ['IGL', 'Fragger', 'Support'],
  other: ['Flex'],
}

export const LFG_REGIONS = ['Tunisie', 'Maghreb', 'Europe', 'MENA', 'NA', 'Autre']

export const GAME_META = Object.fromEntries(LFG_GAMES.map(g=> [g.id, g]))
export const gameLabel = (id)=> GAME_META[id]?.label || id || '—'
export const gameIcon = (id)=> GAME_META[id]?.icon || '🎮'

export const rolesFor = (game)=> LFG_ROLES[game] || LFG_ROLES.other
export const ranksFor = (game)=> LFG_RANKS[game] || LFG_RANKS.other

export function timeAgoShort(iso){
  const t = new Date(iso || 0).getTime()
  if(!t) return ''
  const s = Math.max(1, Math.round((Date.now() - t) / 1000))
  if(s < 60) return `il y a ${s}s`
  const m = Math.round(s / 60)
  if(m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if(h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if(d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR')
}
