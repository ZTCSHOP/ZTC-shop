// Missions quotidiennes, série de connexion & badges — Sprint 2
export const STREAK_TARGET = 7

export const MISSIONS = [
  {
    code: 'login',
    title: 'Connexion quotidienne',
    desc: 'Ouvre ton espace membre et entretiens ta série.',
    xp: 25,
    bonus: true,
    to: '/profile',
  },
  {
    code: 'order',
    title: 'Passer 1 commande',
    desc: 'Une commande dans la boutique aujourd’hui.',
    xp: 40,
    to: '/catalog',
  },
  {
    code: 'reg',
    title: 'S’inscrire à un tournoi',
    desc: 'Rejoins un tournoi aujourd’hui.',
    xp: 60,
    to: '/tournaments',
  },
]

export const BADGES = [
  { code: 'first_order', title: 'Première commande', desc: 'Passer 1 commande', emoji: '🛒', tier: 'bronze' },
  { code: 'orders_5', title: 'Client fidèle', desc: '5 commandes', emoji: '📦', tier: 'silver' },
  { code: 'first_reg', title: 'Premier tournoi', desc: 'S’inscrire à 1 tournoi', emoji: '🎮', tier: 'bronze' },
  { code: 'regs_5', title: 'Compétiteur', desc: '5 inscriptions en tournoi', emoji: '🏆', tier: 'gold' },
  { code: 'team_owner', title: 'Capitaine', desc: 'Créer une équipe', emoji: '🛡️', tier: 'silver' },
  { code: 'referrer_3', title: 'Recruteur', desc: '3 filleuls inscrits', emoji: '🤝', tier: 'silver' },
  { code: 'streak_7', title: 'Inarrêtable', desc: '7 jours de série', emoji: '🔥', tier: 'gold' },
  { code: 'level_10', title: 'Vétéran', desc: 'Atteindre le niveau 10', emoji: '⭐', tier: 'gold' },
  { code: 'vip_member', title: 'VIP', desc: 'Abonnement VIP actif', emoji: '👑', tier: 'gold' },
]

export const BADGE_TIER = {
  bronze: 'border-amber-700/60 text-amber-200',
  silver: 'border-slate-300/50 text-slate-100',
  gold: 'border-amber-400/60 text-amber-200',
}

export const todayKey = ()=> {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${j}`
}

export const isToday = (value)=> {
  if(!value) return false
  const d = new Date(value)
  if(Number.isNaN(d.getTime())) return false
  return todayKey() === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
