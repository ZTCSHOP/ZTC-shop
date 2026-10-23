const DEFAULT_WEBHOOK = import.meta.env.VITE_DISCORD_WEBHOOK ||
  'https://discord.com/api/webhooks/1555575933853896855/FrBhS6dX93fbP30VPXdlyD1An_WYAu8j5rSV1it2YfHkhnMEStOfffIRc32dA0Sw3X3Q'

const KEY = 'ztc_discord_webhook'
const WORKER = (import.meta.env.VITE_R2_WORKER_URL || '').replace(/\/$/, '')
const SITE = 'https://ztcshop.github.io/ZTC-shop'

export function getDiscordWebhook(){
  try{ return localStorage.getItem(KEY) || DEFAULT_WEBHOOK }catch{ return DEFAULT_WEBHOOK }
}
export function setDiscordWebhook(url){
  try{
    if(url) localStorage.setItem(KEY, url)
    else localStorage.removeItem(KEY)
  }catch{}
}

const COLORS = { gold: 0xe0a92e, green: 0x53e07a, red: 0xe05555, blue: 0x5b9cf5, violet: 0xa78bfa }

export async function discordNotify({ title, description = '', fields = [], color = 'gold', url = '', footer = 'ZTC Esports' }){
  const hook = getDiscordWebhook()
  if(!hook || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(hook)) return { ok: false, error: 'no_webhook' }
  const embed = {
    title: String(title || 'ZTC').slice(0, 250),
    description: String(description || '').slice(0, 2000),
    color: COLORS[color] || COLORS.gold,
    fields: (fields || [])
      .filter(f=> f && f.name && f.value != null && String(f.value).trim() !== '')
      .slice(0, 12)
      .map(f=> ({ name: String(f.name).slice(0, 250), value: String(f.value).slice(0, 1000), inline: !!f.inline })),
    footer: { text: footer },
    timestamp: new Date().toISOString(),
  }
  if(url) embed.url = url
  try{
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ZTC Esports', embeds: [embed] }),
    })
    return { ok: r.ok, status: r.status }
  }catch(e){ return { ok: false, error: e.message } }
}

export const discordTournament = (tr)=> discordNotify({
  title: `🏆 ${tr.title}`,
  description: (tr.rules || '').slice(0, 300) || 'Nouveau tournoi ZTC Esports',
  url: `${SITE}/tournaments/${tr.id}`,
  fields: [
    { name: '🎮 Jeu', value: tr.game, inline: true },
    { name: '📅 Date', value: tr.date ? new Date(tr.date).toLocaleString('fr-FR') : 'À venir', inline: true },
    { name: '💰 Prize', value: tr.prize || '—', inline: true },
    { name: '👥 Équipes', value: `${tr.max_teams || 16} max`, inline: true },
    { name: '📝 Inscription', value: 'Sur le site ZTC', inline: true },
  ],
})

export const discordRegistration = (tr, team)=> discordNotify({
  title: '✅ Nouvelle équipe inscrite',
  description: `**${team}** rejoint **${tr.title}**.`,
  url: `${SITE}/tournaments/${tr.id}`,
  color: 'green',
  fields: [
    { name: '🎮 Jeu', value: tr.game, inline: true },
    { name: '📅 Date', value: tr.date ? new Date(tr.date).toLocaleDateString('fr-FR') : '—', inline: true },
  ],
})

export const discordChampion = (tr, champ)=> discordNotify({
  title: '🏆 Champion couronné !',
  description: `**${champ}** remporte **${tr.title}**.`,
  url: `${SITE}/tournaments/${tr.id}`,
  color: 'violet',
  fields: [
    { name: '🎮 Jeu', value: tr.game, inline: true },
    { name: '🥇 Prize', value: tr.prize || '—', inline: true },
  ],
})

export const discordLfg = (post)=> discordNotify({
  title: post.kind === 'team' ? '🛡️ Une équipe recrute' : '🔎 Un joueur cherche une équipe',
  description: (post.description || '').slice(0, 500) || 'Nouvelle annonce LFG sur ZTC.',
  url: `${SITE}/lfg`,
  color: 'blue',
  fields: [
    { name: '🎮 Jeu', value: post.game, inline: true },
    { name: '🏅 Rang', value: post.rank || '—', inline: true },
    { name: '🛡 Rôles', value: (post.roles || []).join(', ') || '—', inline: true },
    ...(post.kind === 'team' ? [{ name: 'Équipe', value: post.team_name || '—', inline: true }] : []),
  ],
})

export async function syncDiscordRole(discordId){
  if(!WORKER || !discordId) return { ok: false }
  try{
    const r = await fetch(`${WORKER}/discord/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: String(discordId), role: 'player' }),
    })
    const data = await r.json().catch(()=>({}))
    return { ok: r.ok, ...data }
  }catch{ return { ok: false } }
}
