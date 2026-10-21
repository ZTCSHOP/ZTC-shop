import { useEffect, useState } from 'react'
import { Gamepad2, Link2, Unlink, RefreshCw, Trophy, Swords, Loader2, Crosshair, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchRiotStats, riotErrorMsg, imgUrl, RIOT_GAMES, RIOT_REGIONS } from '../lib/riot'

export default function RiotCard(){
  const { user, linkRiot, unlinkRiot } = useAuth()
  const [game, setGame] = useState(user?.riot?.game || 'valorant')
  const [region, setRegion] = useState(user?.riot?.region || 'euw')
  const [riotId, setRiotId] = useState(user?.riot ? `${user.riot.name}#${user.riot.tag}` : '')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState('')

  const parseId = (v)=>{
    const s = String(v||'').trim().replace(/^#/, '')
    const i = s.lastIndexOf('#')
    if(i <= 0) return { name: s, tag: '' }
    return { name: s.slice(0, i).trim(), tag: s.slice(i + 1).trim() }
  }

  const load = async (src)=>{
    if(!src) return
    setLoading(true); setErr('')
    try{ setStats(await fetchRiotStats(src)) }
    catch(e){ setErr(riotErrorMsg(e.message)) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{
    if(user?.riot) load({ game: user.riot.game, region: user.riot.region, name: user.riot.name, tag: user.riot.tag })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.riot?.puuid])

  const submit = async (e)=>{
    e.preventDefault()
    const { name, tag } = parseId(riotId)
    if(!name || !tag){ setErr('Écris ton Riot ID complet, ex: Faker#EUW'); return }
    setLinking(true); setErr('')
    try{
      const info = await linkRiot({ game, region, name, tag })
      setStats(info)
    }catch(e){
      const msg = String(e.message || '')
      setErr(msg === 'cloud_only' ? 'Liaison disponible uniquement avec un compte email (cloud).' : riotErrorMsg(msg))
    }finally{ setLinking(false) }
  }

  const unlink = async ()=>{
    if(!window.confirm('Délier ton compte Riot de ton profil ZTC ?')) return
    try{ await unlinkRiot(); setStats(null); setRiotId('') }
    catch(e){ setErr(riotErrorMsg(e.message)) }
  }

  if(!user) return null
  const linked = !!user.riot
  const isValo = user.riot?.game === 'valorant'

  return (
    <div id="riot" className="mt-6 rounded-3xl bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-sky-500/20 p-5 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-black flex items-center gap-2"><Gamepad2 size={17} className="text-sky-300"/> Compte Riot</h2>
        {linked && (
          <button onClick={unlink} className="text-[11px] flex items-center gap-1 text-red-300/80 hover:text-red-300 border border-red-500/30 rounded-full px-2.5 py-1">
            <Unlink size={12}/> Délier
          </button>
        )}
      </div>

      {!linked ? (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <p className="text-[11px] text-white/45">Lie ton compte Riot pour afficher ta carte playstyle (rang, agents, K/D…) sur ton profil.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <select value={game} onChange={e=>setGame(e.target.value)} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-sky-500">
              {RIOT_GAMES.map(g=> <option key={g.v} value={g.v} className="bg-[#121214]">{g.label}</option>)}
            </select>
            <select value={region} onChange={e=>setRegion(e.target.value)} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-sky-500">
              {RIOT_REGIONS.map(r=> <option key={r.v} value={r.v} className="bg-[#121214]">{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={riotId} onChange={e=>setRiotId(e.target.value)} placeholder="Riot ID — ex: Faker#EUW"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-sky-500"/>
            <button disabled={linking} className="px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-black text-sm flex items-center gap-1.5 disabled:opacity-60">
              {linking ? <Loader2 size={15} className="animate-spin"/> : <Link2 size={15}/>} Lier
            </button>
          </div>
          {!user.cloud && <p className="text-[11px] text-amber-300">⚠️ Compte local : crée un compte email pour lier Riot.</p>}
        </form>
      ) : (
        <div className="mt-3">
          {/* En-tête joueur */}
          <div className="flex items-center gap-3">
            {stats?.icon
              ? <img src={imgUrl(stats.icon)} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-2xl object-cover border border-white/10"/>
              : <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-xl">{isValo ? '🎯' : '⚔️'}</div>}
            <div className="min-w-0">
              <div className="font-black truncate">{user.riot.name}<span className="text-white/40">#{user.riot.tag}</span></div>
              <div className="text-[11px] text-white/50">
                {isValo ? 'Valorant' : 'League of Legends'} • {String(user.riot.region || '').toUpperCase()}
                {stats?.level ? ` • Nv.${stats.level}` : ''}
              </div>
            </div>
            <button onClick={()=>load(user.riot)} disabled={loading} className="ml-auto text-white/40 hover:text-white p-2" title="Rafraîchir">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>

          {err && <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{err}</div>}
          {!err && !stats && loading && <div className="mt-3 text-xs text-white/40 flex items-center gap-2"><Loader2 size={13} className="animate-spin"/> Chargement des stats Riot…</div>}

          {stats && (
            <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-4">
              {/* Titre playstyle */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><Gamepad2 size={17} className="text-white/80"/></div>
                <div className="font-black text-sm">Playstyle <span className="text-white/40 font-normal">· last 90 days</span></div>
              </div>

              {/* Rang */}
              {isValo ? (
                <>
                  <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Rank</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5">
                        {stats.ranked?.image
                          ? <img src={imgUrl(stats.ranked.image)} alt="" loading="lazy" decoding="async" className="w-11 h-11 object-contain"/>
                          : <div className="w-11 h-11 rounded-lg bg-white/5"/>}
                        <div>
                          <div className="text-[10px] text-white/40">Current</div>
                          <div className="font-bold text-sm leading-tight">{stats.ranked?.tier || 'Unranked'}</div>
                          {stats.ranked && <div className="text-[10px] text-sky-300">{stats.ranked.rr} RR</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {(stats.peak90?.image || stats.ranked?.image)
                          ? <img src={imgUrl(stats.peak90?.image || stats.ranked.image)} alt="" loading="lazy" decoding="async" className="w-11 h-11 object-contain"/>
                          : <div className="w-11 h-11 rounded-lg bg-white/5"/>}
                        <div>
                          <div className="text-[10px] text-white/40">Peak (90d)</div>
                          <div className="font-bold text-sm leading-tight">{stats.peak90?.tier || stats.ranked?.peakAllTime || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agents */}
                  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Most played agents</div>
                    {stats.agents?.length
                      ? <div className="mt-2 grid grid-cols-4 gap-2">
                          {stats.agents.map(a=>(
                            <div key={a.name} className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
                              {a.icon && <img src={imgUrl(a.icon)} alt={a.name} loading="lazy" decoding="async" className="w-full aspect-square object-cover"/>}
                              <span className="absolute bottom-1 left-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500 text-white">{a.pct}%</span>
                            </div>
                          ))}
                        </div>
                      : <div className="text-[11px] text-white/40 mt-1">—</div>}
                  </div>

                  {/* Skill */}
                  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Skill overview</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Crosshair size={16} className="text-red-400 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.stats?.kd ?? '—'}</div><div className="text-[10px] text-white/40">K/D ratio</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-sky-400 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.stats?.hs ?? '—'}%</div><div className="text-[10px] text-white/40">Headshot</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Swords size={16} className="text-pink-400 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.stats?.matches ?? '—'}</div><div className="text-[10px] text-white/40">Matchs</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-amber-300 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.stats?.winrate ?? '—'}%</div><div className="text-[10px] text-white/40">Win</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Derniers matchs */}
                  {stats.recent?.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-white/60">Derniers matchs</div>
                      <div className="mt-1.5 space-y-1">
                        {stats.recent.map((m, i)=>(
                          <div key={i} className="flex items-center gap-2 text-[11px] rounded-lg bg-black/20 border border-white/5 px-2 py-1.5">
                            <span className={`font-black w-4 text-center ${m.result === 'W' ? 'text-emerald-400' : 'text-red-400'}`}>{m.result}</span>
                            {m.icon && <img src={imgUrl(m.icon)} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded object-cover"/>}
                            <span className="text-white/70 flex-1 truncate">{m.agent} <span className="text-white/30">· {m.map}</span></span>
                            <span className="text-white/50">{m.kills}/{m.deaths}/{m.assists}</span>
                            <span className="text-sky-300 font-bold">{m.kd} KD</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Rank</div>
                    <div className="mt-2 flex items-center gap-3">
                      {stats.ranked?.emblem
                        ? <img src={imgUrl(stats.ranked.emblem)} alt="" loading="lazy" decoding="async" className="w-12 h-12 object-contain"/>
                        : <div className="w-12 h-12 rounded-lg bg-white/5"/>}
                      <div>
                        <div className="font-bold text-sm">{stats.ranked ? `${stats.ranked.tier} ${stats.ranked.division}` : 'Unranked'}</div>
                        {stats.ranked && <div className="text-[11px] text-sky-300">{stats.ranked.lp} LP · {stats.ranked.winrate}% WR</div>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Most played champions</div>
                    {stats.champions?.length
                      ? <div className="mt-2 grid grid-cols-4 gap-2">
                          {stats.champions.map(c=>(
                            <div key={c.id} className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
                              <img src={imgUrl(c.icon)} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover"/>
                              <span className="absolute bottom-1 left-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-500 text-white">{c.pct}%</span>
                            </div>
                          ))}
                        </div>
                      : <div className="text-[11px] text-white/40 mt-1">—</div>}
                  </div>

                  <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                    <div className="text-[11px] font-bold text-white/60">Overview</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-amber-300 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.ranked?.wins ?? '—'}</div><div className="text-[10px] text-white/40">Wins</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Swords size={16} className="text-pink-400 shrink-0"/>
                        <div><div className="font-black text-sm leading-tight">{stats.ranked ? `${stats.ranked.wins + stats.ranked.losses}` : '—'}</div><div className="text-[10px] text-white/40">Ranked games</div></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
