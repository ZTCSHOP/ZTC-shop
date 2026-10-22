const KEY = 'ztc_prefs'

export const DEFAULT_PREFS = {
  notif_order: true,
  notif_tournament: true,
  notif_reward: true,
  notif_wallet: true,
  notif_vip: true,
  notif_team: true,
  animations: true,
}

export const PREF_ITEMS = [
  { key: 'notif_order', label: 'Commandes', desc: 'Statut de tes commandes', type: 'order' },
  { key: 'notif_tournament', label: 'Tournois', desc: 'Inscriptions et nouveaux tournois', type: 'tournament' },
  { key: 'notif_reward', label: 'Récompenses XP', desc: 'Validation ou refus des paliers', type: 'reward' },
  { key: 'notif_wallet', label: 'Portefeuille', desc: 'Recharges approuvées ou refusées', type: 'wallet' },
  { key: 'notif_vip', label: 'ZTC VIP', desc: 'Activation et suivi VIP', type: 'vip' },
  { key: 'notif_team', label: 'Équipes', desc: 'Demandes pour rejoindre une équipe', type: 'team' },
]

export function getPrefs(){
  try{
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...DEFAULT_PREFS, ...(raw && typeof raw === 'object' ? raw : {}) }
  }catch{ return { ...DEFAULT_PREFS } }
}

export function savePrefs(patch){
  const next = { ...getPrefs(), ...patch }
  try{ localStorage.setItem(KEY, JSON.stringify(next)) }catch{}
  applyPrefs(next)
  try{ window.dispatchEvent(new CustomEvent('ztc:prefs', { detail: next })) }catch{}
  return next
}

export function applyPrefs(p = getPrefs()){
  try{ document.documentElement.classList.toggle('reduce-motion', !p.animations) }catch{}
}

export function notifAllowed(type, p = getPrefs()){
  const item = PREF_ITEMS.find(i => i.type === type)
  if(!item) return true
  return p[item.key] !== false
}
