// ============================================================
//  ZTC Shop — Cloudflare Worker
//  1) POST /upload       → upload d'images vers R2
//  2) GET  /img?u=URL    → proxy + cache R2 des images (Valorant/LoL)
//  3) GET  /riot         → Riot ID → stats LoL / Valorant
//  ------------------------------------------------------------
//  Bindings / Variables :
//    R2      : BUCKET = ztc-media
//    Var     : PUBLIC_BASE = URL publique du bucket
//    Secret  : RIOT_API_KEY   (developer.riotgames.com)
//    Secret  : HENRIK_API_KEY (api.henrikdev.xyz)
// ============================================================

const ALLOWED_ORIGINS = [
  'https://ztcshop.github.io',
  'https://ztc-shop.tn',
  'https://www.ztc-shop.tn',
]

function cors(origin){
  const allow = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}
function json(obj, status, origin){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  })
}

// ---------- Régions ----------
const REGIONS = {
  euw:  { platform: 'euw1', routing: 'europe',   valo: 'eu' },
  eune: { platform: 'eun1', routing: 'europe',   valo: 'eu' },
  tr:   { platform: 'tr1',  routing: 'europe',   valo: 'eu' },
  ru:   { platform: 'ru',   routing: 'europe',   valo: 'eu' },
  na:   { platform: 'na1',  routing: 'americas', valo: 'na' },
  br:   { platform: 'br1',  routing: 'americas', valo: 'na' },
  lan:  { platform: 'la1',  routing: 'americas', valo: 'na' },
  las:  { platform: 'la2',  routing: 'americas', valo: 'na' },
  kr:   { platform: 'kr',   routing: 'asia',     valo: 'kr' },
  jp:   { platform: 'jp1',  routing: 'asia',     valo: 'ap' },
  oce:  { platform: 'oc1',  routing: 'sea',      valo: 'ap' },
}

const LOL_ICON = (id)=> `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${id}.jpg`
const LOL_CHAMP = (id)=> `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`
const LOL_EMBLEM = (tier)=> `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${String(tier||'').toLowerCase()}.png`

const LOL_TIERS = {
  IRON:'Iron', BRONZE:'Bronze', SILVER:'Silver', GOLD:'Gold', PLATINUM:'Platinum',
  EMERALD:'Emerald', DIAMOND:'Diamond', MASTER:'Master', GRANDMASTER:'Grandmaster', CHALLENGER:'Challenger',
}

async function riotFetch(url, key){
  const r = await fetch(url, { headers: { 'X-Riot-Token': key } })
  if(r.status === 404) return { notFound: true }
  if(!r.ok) return { error: r.status === 403 ? 'riot_key_invalid' : r.status === 429 ? 'rate_limited' : `riot_${r.status}` }
  return { data: await r.json() }
}

// ---------- /img : proxy + stockage R2 ----------
const IMG_HOSTS = new Set([
  'media.valorant-api.com',
  'raw.communitydragon.org',
  'ddragon.leagueoflegends.com',
])

async function handleImg(url, env, origin){
  const raw = url.searchParams.get('u')
  if(!raw) return json({ error: 'missing_u' }, 400, origin)
  let u
  try{ u = new URL(raw) }catch{ return json({ error: 'bad_u' }, 400, origin) }
  if(u.protocol !== 'https:' || !IMG_HOSTS.has(u.host)) return json({ error: 'host_not_allowed' }, 403, origin)

  const key = `img/${u.host}${u.pathname}`.replace(/[^a-zA-Z0-9._/-]/g, '_')

  const cached = await env.BUCKET.get(key)
  if(cached){
    return new Response(cached.body, {
      headers: {
        'Content-Type': cached.httpMetadata?.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...cors(origin),
      },
    })
  }

  const r = await fetch(u.toString())
  if(!r.ok) return json({ error: `img_${r.status}` }, 502, origin)
  const ct = r.headers.get('content-type') || 'image/png'
  const buf = await r.arrayBuffer()
  await env.BUCKET.put(key, buf, {
    httpMetadata: { contentType: ct, cacheControl: 'public, max-age=31536000, immutable' },
  })
  return new Response(buf, {
    headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=31536000, immutable', ...cors(origin) },
  })
}

// ---------- LoL ----------
async function handleLol({ name, tag, region }, env){
  if(!env.RIOT_API_KEY) return { status: 500, body: { error: 'riot_key_missing' } }
  const cfg = REGIONS[region]
  if(!cfg) return { status: 400, body: { error: 'bad_region' } }

  const acc = await riotFetch(
    `https://${cfg.routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
    env.RIOT_API_KEY)
  if(acc.error) return { status: 502, body: { error: acc.error } }
  if(acc.notFound) return { status: 404, body: { error: 'not_found' } }

  const puuid = acc.data.puuid
  const sum = await riotFetch(
    `https://${cfg.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    env.RIOT_API_KEY)
  if(sum.error) return { status: 502, body: { error: sum.error } }

  let ranked = null
  const lg = await riotFetch(
    `https://${cfg.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
    env.RIOT_API_KEY)
  const entries = Array.isArray(lg.data) ? lg.data : []
  const solo = entries.find(e=> e.queueType === 'RANKED_SOLO_5x5')
  if(solo){
    const games = (solo.wins||0) + (solo.losses||0)
    ranked = {
      tier: LOL_TIERS[solo.tier] || solo.tier,
      division: solo.rank || '',
      lp: solo.leaguePoints || 0,
      wins: solo.wins || 0,
      losses: solo.losses || 0,
      winrate: games ? Math.round((solo.wins / games) * 100) : 0,
      emblem: LOL_EMBLEM(solo.tier),
      tierKey: solo.tier,
    }
  }

  let champions = []
  const cm = await riotFetch(
    `https://${cfg.platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=4`,
    env.RIOT_API_KEY)
  if(Array.isArray(cm.data)){
    const total = cm.data.reduce((s,c)=> s + (c.championPoints||0), 0) || 1
    champions = cm.data.map(c=> ({
      id: c.championId,
      points: c.championPoints || 0,
      level: c.championLevel || 0,
      pct: Math.round(((c.championPoints||0) / total) * 100),
      icon: LOL_CHAMP(c.championId),
    }))
  }

  return { status: 200, body: {
    game: 'lol', puuid,
    name: acc.data.gameName, tag: acc.data.tagLine,
    region, level: sum.data?.summonerLevel || null,
    icon: sum.data?.profileIconId ? LOL_ICON(sum.data.profileIconId) : null,
    ranked, champions,
  } }
}

// ---------- Valorant (HenrikDev) ----------
async function henrik(path, key){
  if(!key) return { error: 'henrik_key_missing' }
  const r = await fetch(`https://api.henrikdev.xyz${path}`, { headers: { Authorization: key } })
  if(r.status === 404) return { notFound: true }
  if(!r.ok) return { error: r.status === 429 ? 'rate_limited' : `henrik_${r.status}` }
  return { data: await r.json() }
}

async function handleValorant({ name, tag, region }, env){
  const cfg = REGIONS[region]
  if(!cfg) return { status: 400, body: { error: 'bad_region' } }
  const vr = cfg.valo
  const n = encodeURIComponent(name)
  const t = encodeURIComponent(tag)

  const mmr = await henrik(`/valorant/v2/mmr/${vr}/${n}/${t}`, env.HENRIK_API_KEY)
  if(mmr.error) return { status: 502, body: { error: mmr.error } }
  if(mmr.notFound) return { status: 404, body: { error: 'not_found' } }

  const d = mmr.data?.data || {}
  const cur = d.current_data || {}
  const peakAllTime = d.highest_rank || {}

  const ac = await henrik(`/valorant/v1/account/${n}/${t}`, env.HENRIK_API_KEY)
  const account = ac.data?.data || null

  // Peak sur 90 jours (mmr history, 20 dernières parties)
  const hist = await henrik(`/valorant/v1/mmr-history/${vr}/${n}/${t}`, env.HENRIK_API_KEY)
  const cutoff = Math.floor(Date.now() / 1000) - 90 * 86400
  const histRows = (Array.isArray(hist.data?.data) ? hist.data.data : [])
    .filter(h=> (h.date_raw || 0) >= cutoff)
  let peak90 = null
  for(const h of histRows){
    if(!peak90 || (h.currenttier || 0) > (peak90.tierId || 0)){
      peak90 = {
        tier: h.currenttierpatched || '',
        tierId: h.currenttier || 0,
        image: h.images?.large || '',
      }
    }
  }

  // Derniers matchs (10 max via Henrik) → stats globales + agents
  const ms = await henrik(`/valorant/v3/matches/${vr}/${n}/${t}?size=10`, env.HENRIK_API_KEY)
  const matches = Array.isArray(ms.data?.data) ? ms.data.data : []

  let k = 0, dd = 0, a = 0, hs = 0, bs = 0, ls = 0, wins = 0
  const agentsMap = new Map()
  const recent = []
  const nameLc = name.toLowerCase(), tagLc = tag.toLowerCase()

  for(const m of matches){
    const me = (m.players?.all_players || []).find(p=>
      (p.name || '').toLowerCase() === nameLc && (p.tag || '').toLowerCase() === tagLc)
    if(!me) continue
    const s = me.stats || {}
    k += s.kills || 0; dd += s.deaths || 0; a += s.assists || 0
    hs += s.headshots || 0; bs += s.bodyshots || 0; ls += s.legshots || 0
    const team = (me.team || '').toLowerCase()
    const won = team === 'red' ? !!m.teams?.red?.has_won : !!m.teams?.blue?.has_won
    if(won) wins++

    const agent = me.character || '—'
    const icon = me.assets?.agent?.small || ''
    const key = agent.toLowerCase()
    if(!agentsMap.has(key)) agentsMap.set(key, { name: agent, icon, count: 0 })
    agentsMap.get(key).count++

    recent.push({
      map: m.metadata?.map || '',
      agent,
      icon,
      result: won ? 'W' : 'L',
      kills: s.kills || 0, deaths: s.deaths || 0, assists: s.assists || 0,
      kd: s.deaths ? +((s.kills || 0) / s.deaths).toFixed(2) : (s.kills || 0),
    })
  }

  const total = matches.length
  const shots = hs + bs + ls
  const agents = [...agentsMap.values()]
    .sort((x, y)=> y.count - x.count)
    .slice(0, 4)
    .map(x=> ({ ...x, pct: total ? Math.round((x.count / total) * 100) : 0 }))

  return { status: 200, body: {
    game: 'valorant',
    puuid: d.puuid || account?.puuid || null,
    name: account?.name || d.name || name,
    tag: account?.tag || d.tag || tag,
    region,
    level: account?.account_level || null,
    icon: account?.card?.small || null,
    ranked: cur.currenttierpatched ? {
      tier: cur.currenttierpatched,
      tierId: cur.currenttier || 0,
      rr: cur.ranking_in_tier || 0,
      lastChange: cur.mmr_change_to_last_game || 0,
      image: cur.images?.large || '',
      peakAllTime: peakAllTime.patched_tier || null,
    } : null,
    peak90,
    stats: {
      matches: total,
      wins,
      winrate: total ? Math.round((wins / total) * 100) : 0,
      kd: dd ? +(k / dd).toFixed(2) : k,
      hs: shots ? Math.round((hs / shots) * 100) : 0,
      kills: k, deaths: dd, assists: a,
    },
    agents,
    recent: recent.slice(0, 5),
  } }
}

async function handleRiot(url, env, ctx, origin){
  const game = (url.searchParams.get('game') || '').toLowerCase()
  const region = (url.searchParams.get('region') || '').toLowerCase()
  const name = (url.searchParams.get('name') || '').trim()
  const tag = (url.searchParams.get('tag') || '').trim().replace(/^#/, '')

  if(!['lol','valorant'].includes(game)) return json({ error: 'bad_game' }, 400, origin)
  if(!name || !tag) return json({ error: 'missing_riot_id' }, 400, origin)
  if(name.length > 40 || tag.length > 16) return json({ error: 'bad_riot_id' }, 400, origin)

  const cache = caches.default
  const cacheKey = new Request(url.toString(), { method: 'GET' })
  const hit = await cache.match(cacheKey)
  if(hit){
    const body = await hit.text()
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...cors(origin) },
    })
  }

  const res = game === 'lol'
    ? await handleLol({ name, tag, region }, env)
    : await handleValorant({ name, tag, region }, env)

  if(res.status !== 200) return json(res.body, res.status, origin)

  const out = new Response(JSON.stringify(res.body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      ...cors(origin),
    },
  })
  ctx.waitUntil(cache.put(cacheKey, out.clone()))
  return out
}

export default {
  async fetch(request, env, ctx){
    const origin = request.headers.get('Origin')
    if(request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    const url = new URL(request.url)

    if(url.pathname === '/riot' && request.method === 'GET') return handleRiot(url, env, ctx, origin)
    if(url.pathname === '/img' && request.method === 'GET') return handleImg(url, env, origin)

    if(url.pathname !== '/upload' || request.method !== 'POST'){
      return json({ error: 'not found' }, 404, origin)
    }

    let form
    try{ form = await request.formData() }
    catch{ return json({ error: 'bad form' }, 400, origin) }

    const file = form.get('file')
    const folder = (String(form.get('folder') || 'misc').replace(/[^a-z0-9_-]/gi, '') || 'misc')

    if(!file || typeof file === 'string') return json({ error: 'no file' }, 400, origin)
    if(!/^image\//.test(file.type)) return json({ error: 'not an image' }, 415, origin)
    if(file.size > 5 * 1024 * 1024) return json({ error: 'too big (max 5MB)' }, 413, origin)

    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try{
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      })
    }catch(e){
      return json({ error: 'upload failed: ' + e.message }, 500, origin)
    }

    const base = (env.PUBLIC_BASE || '').replace(/\/$/, '')
    if(!base) return json({ error: 'PUBLIC_BASE not set' }, 500, origin)
    return json({ url: `${base}/${key}` }, 200, origin)
  },
}
