const WORKER = (import.meta.env.VITE_R2_WORKER_URL || '').replace(/\/$/, '')

// Toutes les images (rank, agents, champions) passent par le Worker -> R2 (Cloudflare)
export const imgUrl = (remote)=>{
  if(!remote) return ''
  if(!WORKER) return remote
  return `${WORKER}/img?u=${encodeURIComponent(remote)}`
}

export const RIOT_GAMES = [
  { v: 'lol', label: 'League of Legends' },
  { v: 'valorant', label: 'Valorant' },
]

export const RIOT_REGIONS = [
  { v: 'euw', label: 'EUW — Europe Ouest' },
  { v: 'eune', label: 'EUNE — Europe Nord' },
  { v: 'tr', label: 'TR — Turquie' },
  { v: 'ru', label: 'RU — Russie' },
  { v: 'na', label: 'NA — Amérique du Nord' },
  { v: 'br', label: 'BR — Brésil' },
  { v: 'lan', label: 'LAN — Amérique Latine Nord' },
  { v: 'las', label: 'LAS — Amérique Latine Sud' },
  { v: 'kr', label: 'KR — Corée' },
  { v: 'jp', label: 'JP — Japon' },
  { v: 'oce', label: 'OCE — Océanie' },
]

export async function fetchRiotStats({ game, region, name, tag }){  if(!WORKER) throw new Error('worker_missing')
  const qs = new URLSearchParams({ game, region, name, tag: String(tag).replace(/^#/, '') })
  let r
  try{ r = await fetch(`${WORKER}/riot?${qs}`) }
  catch{ throw new Error('network') }
  const data = await r.json().catch(()=>({}))
  if(!r.ok) throw new Error(data.error || `http_${r.status}`)
  return data
}

export function riotErrorMsg(code){
  const map = {
    worker_missing: 'Service Riot indisponible (worker non configuré).',
    network: 'Connexion impossible au service Riot.',
    riot_key_missing: 'Clé API Riot pas encore configurée.',
    henrik_key_missing: 'Clé HenrikDev pas encore configurée (Valorant).',
    riot_key_invalid: 'Clé API Riot invalide ou expirée (dev key = 24h).',
    not_found: 'Riot ID introuvable — vérifie Name#TAG et la région.',
    bad_riot_id: 'Format Riot ID invalide (ex: Faker#EUW).',
    bad_region: 'Région invalide.',
    bad_game: 'Jeu invalide.',
    missing_riot_id: 'Renseigne ton Riot ID complet (Name#TAG).',
    rate_limited: 'Trop de requêtes — réessaie dans 1 minute.',
  }
  return map[code] || `Erreur Riot (${code}).`
}
