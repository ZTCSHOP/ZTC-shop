import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Shield, Trophy, Swords, Crown, Sparkles, Lock, CheckCircle2, Gamepad2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { fetchRiotStats, riotErrorMsg } from '../lib/riot'
import { xpForActivity, levelProgress, REWARDS } from '../lib/level'
import PlayerRiotCard from '../components/PlayerRiotCard'
import GameTiles from '../components/GameTiles'

export default function PlayerProfile(){
  const { id } = useParams()
  const { allAccounts, profileAssets, regs, teams, tournaments, orders, xpOf, cloud } = useAuth()
  const { t } = useLang()
  const [pub, setPub] = useState(undefined) // undefined = chargement, null = introuvable
  const [pubErr, setPubErr] = useState('')
  const [riotStats, setRiotStats] = useState(null)
  const [riotLoading, setRiotLoading] = useState(false)
  const [riotErr, setRiotErr] = useState('')

  // Profil public (nom, XP, VIP, Riot, badges) — lisible par tous les membres
  useEffect(()=>{
    let alive = true
    setRiotStats(null); setRiotErr(''); setPubErr('')
    if(!cloud || !supabase){ setPub(null); return }
    setPub(undefined)
    supabase.rpc('public_player', { p_id: id }).then(({ data, error })=>{
      if(!alive) return
      if(error){ console.warn('public_player:', error.message); setPubErr(error.message); setPub(null) }
      else setPub(data || null)
    })
    return ()=>{ alive = false }
  }, [id, cloud])

  const riotGame = pub?.riot_game
  const riotRegion = pub?.riot_region
  const riotName = pub?.riot_game_name
  const riotTag = pub?.riot_tag_line

  useEffect(()=>{
    if(!riotName || !riotTag){ setRiotStats(null); return }
    let alive = true
    setRiotLoading(true); setRiotErr('')
    fetchRiotStats({ game: riotGame || 'valorant', region: riotRegion || 'euw', name: riotName, tag: riotTag })
      .then(s=>{ if(alive) setRiotStats(s) })
      .catch(e=>{ if(alive) setRiotErr(riotErrorMsg(e.message)) })
      .finally(()=>{ if(alive) setRiotLoading(false) })
    return ()=>{ alive = false }
  }, [riotGame, riotRegion, riotName, riotTag])

  const accounts = allAccounts()
  const acc = accounts.find(a=> a.id===id)
  const asset = profileAssets[id] || {}
  const games = Array.isArray(asset.games) ? asset.games : []

  const myRegs = regs.filter(r=> r.userId===id)
  const myOwnTeams = teams.filter(x=> x.userId===id)
  const teamNames = [...new Set([...myOwnTeams.map(x=>x.name), ...myRegs.map(r=>r.team)].filter(Boolean))]
  const myOrders = orders.filter(o=> o.userId===id)
  const localXp = xpForActivity({ orders: myOrders.length, regs: myRegs.length, teams: myOwnTeams.length })
  const xp = Number(pub?.xp ?? (acc?.cloud ? xpOf(id) : localXp))
  const { level, cur, need } = levelProgress(xp)
  const pct = Math.min(100, Math.round((cur / need) * 100))

  const name = pub?.name || asset.name || acc?.name || 'Joueur'
  const avatar = asset.avatar || ''
  const banner = asset.banner || ''
  const vipUntil = pub?.vip_until
  const isVip = !!pub?.is_vip && (!vipUntil || new Date(vipUntil) > new Date())
  const badges = Array.isArray(pub?.badges) ? pub.badges : []
  const riot = (riotName && riotTag)
    ? { game: riotGame || 'valorant', region: riotRegion || 'euw', name: riotName, tag: riotTag }
    : null

  if(pub === undefined){
    return <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-white/50">Chargement du profil…</div>
  }

  if(!pub && !asset.name && myRegs.length===0 && myOwnTeams.length===0){
    return <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-white/60">Joueur introuvable <Link to="/teams" className="text-emerald-300">← {t('teams')}</Link></div>
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/teams" className="text-sm text-white/60 hover:text-white">← {t('teams')}</Link>
      <div className="mt-4 rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10">
        {banner
          ? <img src={banner} alt="" loading="lazy" decoding="async" className="w-full h-44 md:h-56 object-cover"/>
          : <div className="w-full h-24 bg-gradient-to-r from-emerald-900/40 to-teal-900/20"/>}
        <div className="p-5 flex items-center gap-4 -mt-10">
          {avatar
            ? <img src={avatar} alt="" loading="lazy" decoding="async" className="w-20 h-20 rounded-full object-cover border-4 border-[#121214]"/>
            : <div className="w-20 h-20 rounded-full bg-lime-600 flex items-center justify-center font-black text-3xl text-black border-4 border-[#121214]">{(name||'?')[0].toUpperCase()}</div>}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black truncate">{name}</h1>
              {isVip
                ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-gradient-to-r from-amber-300 to-yellow-500 rounded-full px-2 py-0.5"><Crown size={11}/> VIP</span>
                : <span className="text-[10px] font-bold text-white/45 border border-white/15 rounded-full px-2 py-0.5">Membre</span>}
            </div>
            <div className="text-xs text-white/50">Niveau {level} • {xp.toLocaleString('fr-FR')} XP</div>
          </div>
        </div>
        <div className="px-5 pb-2"><div className="h-1.5 rounded-full bg-white/10 overflow-hidden xp-track"><div className="h-full rounded-full xp-fill" style={{ width: `${pct}%` }}/></div></div>
        <div className="p-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-amber-300 text-lg">{myRegs.length}</div><div className="text-[11px] text-white/50">Tournois</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-emerald-300 text-lg">{teamNames.length}</div><div className="text-[11px] text-white/50">Équipes</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-purple-300 text-lg">{badges.length}</div><div className="text-[11px] text-white/50">Badges</div></div>
        </div>
      </div>

      {games.length>0 && (
        <section className="mt-6 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#101528] to-[#0a0e1a] p-5">
          <h2 className="mb-4 flex items-center gap-2 font-black"><Gamepad2 size={16} className="text-violet-300"/> My game</h2>
          <GameTiles selected={games}/>
        </section>
      )}

      {pubErr && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          ⚠️ Certaines infos publiques (XP, VIP, Riot) sont indisponibles. Admin : exécute <b>xp-system-sql.txt</b> dans Supabase.
        </div>
      )}

      <h2 className="font-black mt-6 mb-2 flex items-center gap-2"><Sparkles size={15} className="text-purple-300"/> XP & Récompenses</h2>
      <div className="rounded-2xl bg-gradient-to-br from-lime-500/10 to-royal-500/5 border border-lime-500/20 p-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>{cur} / {need} XP vers le niveau {level + 1}</span>
          <span className="font-bold text-purple-200">{xp.toLocaleString('fr-FR')} XP au total</span>
        </div>
        <div className="mt-2 grid sm:grid-cols-3 gap-2">
          {REWARDS.map(r=>{
            const owned = badges.includes(r.tier)
            const reached = xp >= r.xp
            return (
              <div key={r.tier} className={`rounded-xl border p-3 ${owned ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : reached ? 'border-purple-500/35 bg-black/25' : 'border-white/10 bg-black/20 opacity-65'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight">{r.label}</span>
                </div>
                <div className="mt-1.5 text-[10px] font-bold flex items-center gap-1">
                  {owned
                    ? <><CheckCircle2 size={11} className="text-emerald-300"/> <span className="text-emerald-300">Badge obtenu</span></>
                    : reached
                      ? <span className="text-purple-300">Palier atteint</span>
                      : <><Lock size={10} className="text-white/40"/> <span className="text-white/40">{r.xp.toLocaleString('fr-FR')} XP</span></>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {riot
        ? <PlayerRiotCard riot={riot} stats={riotStats} loading={riotLoading} error={riotErr}/>
        : <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/40">🎮 Compte Riot non lié par ce membre.</div>}

      <h2 className="font-black mt-6 mb-2 flex items-center gap-2"><Shield size={15}/> Équipes</h2>
      {teamNames.length===0
        ? <div className="text-sm text-white/40">—</div>
        : <div className="grid sm:grid-cols-2 gap-2">{teamNames.map(n=>(
            <Link key={n} to={`/teams/${encodeURIComponent(n)}`} className="rounded-2xl bg-white/5 border border-white/10 p-3 font-bold hover:border-emerald-500/50">🛡️ {n}</Link>
          ))}</div>}

      <h2 className="font-black mt-6 mb-2 flex items-center gap-2"><Trophy size={15}/> Tournois</h2>
      {myRegs.length===0
        ? <div className="text-sm text-white/40">—</div>
        : <div className="grid sm:grid-cols-2 gap-2">{myRegs.map(r=>{
            const tr = tournaments.find(x=>x.id===r.tournament_id)
            return <Link key={r.id} to={tr?`/tournaments/${tr.id}`:'/tournaments'} className="rounded-2xl bg-white/5 border border-white/10 p-3 hover:border-amber-500/50"><div className="font-bold text-sm">🏆 {tr?.title||r.tournament_id}</div><div className="text-[11px] text-white/50">🛡️ {r.team}</div></Link>
          })}</div>}

      <div className="mt-6 text-xs text-white/30 flex items-center gap-1"><Swords size={12}/> ZTC-GAMING</div>
    </div>
  )
}
