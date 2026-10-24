export const GAMES = [
  { id: 'lol', label: 'League of Legends', short: 'LoL', icon: '⚔️', image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg', tint: 'from-rose-600/50' },
  { id: 'valorant', label: 'Valorant', short: 'VALORANT', icon: '🎯', image: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png', tint: 'from-red-600/50' },
  { id: 'cs2', label: 'Counter-Strike 2', short: 'CS2', icon: '🔫', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg', tint: 'from-amber-600/50' },
  { id: 'r6', label: 'Rainbow Six Siege', short: 'RAINBOW SIX SIEGE', icon: '🛡️', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg', tint: 'from-orange-600/50' },
  { id: 'fortnite', label: 'Fortnite', short: 'FORTNITE', icon: '🏗️', image: '', tint: 'from-purple-600/60' },
  { id: 'ea_fc', label: 'EA SPORTS FC', short: 'EA SPORTS FC', icon: '⚽', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/header.jpg', tint: 'from-emerald-600/50' },
  { id: 'efootball', label: 'eFootball', short: 'eFOOTBALL', icon: '⚽', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1665460/header.jpg', tint: 'from-blue-600/50' },
  { id: 'brawlhalla', label: 'Brawlhalla', short: 'BRAWLHALLA', icon: '🪓', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/291550/header.jpg', tint: 'from-cyan-600/50' },
  { id: 'rocket_league', label: 'Rocket League', short: 'ROCKET LEAGUE', icon: '🚀', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/header.jpg', tint: 'from-sky-600/50' },
  { id: 'cod', label: 'Call of Duty', short: 'CALL OF DUTY', icon: '💥', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/header.jpg', tint: 'from-zinc-600/50' },
  { id: 'overwatch2', label: 'Overwatch 2', short: 'OVERWATCH 2', icon: '🌀', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/header.jpg', tint: 'from-violet-600/50' },
  { id: 'apex', label: 'Apex Legends', short: 'APEX LEGENDS', icon: '🦾', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg', tint: 'from-red-700/50' },
  { id: 'fc27', label: 'EA SPORTS FC', short: 'EA SPORTS FC', icon: '⚽', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/header.jpg', tint: 'from-emerald-600/50' },
  { id: 'tekken8', label: 'Tekken 8', short: 'TEKKEN 8', icon: '🥊', image: '', tint: 'from-orange-700/50' },
  { id: 'other', label: 'Autre', short: 'AUTRE', icon: '🎮', image: '', tint: 'from-slate-600/50' },
]

const GAME_BY_ID = Object.fromEntries(GAMES.map(game=> [game.id, game]))

export const gameMeta = (id)=> GAME_BY_ID[String(id || '').toLowerCase()] || {
  id,
  label: id || 'Autre',
  short: id || 'AUTRE',
  icon: '🎮',
  image: '',
  tint: 'from-slate-600/50',
}

export const canonicalGameId = (id)=>{
  const value = String(id || '').toLowerCase()
  if(value === 'fc27' || value === 'eafc' || value === 'ea sports fc') return 'ea_fc'
  if(value === 'rainbow six siege' || value === 'rainbow6' || value === 'r6s') return 'r6'
  if(value === 'rocket' || value === 'rocket league') return 'rocket_league'
  if(value === 'overwatch 2') return 'overwatch2'
  if(value === 'call of duty') return 'cod'
  if(value === 'league of legends') return 'lol'
  if(value === 'counter-strike 2') return 'cs2'
  return value
}
