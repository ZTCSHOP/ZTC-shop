import { Link, useParams } from 'react-router-dom'
import { Shield, Trophy, Swords } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { xpForActivity, levelProgress } from '../lib/level'

export default function PlayerProfile(){
  const { id } = useParams()
  const { allAccounts, profileAssets, regs, teams, tournaments, orders } = useAuth()
  const { t } = useLang()
  const accounts = allAccounts()
  const acc = accounts.find(a=> a.id===id)
  const asset = profileAssets[id] || {}
  const name = asset.name || acc?.name || 'Joueur'
  const avatar = asset.avatar || ''
  const banner = asset.banner || ''
  const myRegs = regs.filter(r=> r.userId===id)
  const myOwnTeams = teams.filter(x=> x.userId===id)
  const teamNames = [...new Set([...myOwnTeams.map(x=>x.name), ...myRegs.map(r=>r.team)].filter(Boolean))]
  const myOrders = orders.filter(o=> o.userId===id)
  const xp = xpForActivity({ orders: myOrders.length, regs: myRegs.length, teams: myOwnTeams.length })
  const { level, cur, need } = levelProgress(xp)

  if(!acc && !asset.name && myRegs.length===0 && myOwnTeams.length===0){
    return <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-white/60">Joueur introuvable <Link to="/teams" className="text-emerald-300">← {t('teams')}</Link></div>
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/teams" className="text-sm text-white/60 hover:text-white">← {t('teams')}</Link>
      <div className="mt-4 rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10">
        {banner
          ? <img src={banner} alt="" className="w-full h-44 md:h-56 object-cover"/>
          : <div className="w-full h-24 bg-gradient-to-r from-emerald-900/40 to-teal-900/20"/>}
        <div className="p-5 flex items-center gap-4 -mt-10">
          {avatar
            ? <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-[#121214]"/>
            : <div className="w-20 h-20 rounded-full bg-lime-600 flex items-center justify-center font-black text-3xl text-black border-4 border-[#121214]">{(name||'?')[0].toUpperCase()}</div>}
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{name}</h1>
            <div className="text-xs text-white/50">Niveau {level} • {cur}/{need} XP</div>
          </div>
        </div>
        <div className="px-5 pb-2"><div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${Math.min(100, Math.round((cur/need)*100))}%` }}/></div></div>
        <div className="p-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-amber-300 text-lg">{myRegs.length}</div><div className="text-[11px] text-white/50">Tournois</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-emerald-300 text-lg">{teamNames.length}</div><div className="text-[11px] text-white/50">Équipes</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 py-2.5"><div className="font-black text-teal-300 text-lg">{myOrders.length}</div><div className="text-[11px] text-white/50">Commandes</div></div>
        </div>
      </div>

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

      <div className="mt-6 text-xs text-white/30 flex items-center gap-1"><Swords size={12}/> ZTC Shop</div>
    </div>
  )
}
