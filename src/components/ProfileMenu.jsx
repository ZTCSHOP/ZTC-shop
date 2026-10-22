import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Trophy, Shield, Wallet, ShoppingBag, Settings, Flag, LogOut, Crown, Gift, Gamepad2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { xpForActivity, levelProgress } from '../lib/level'

const providerColor = { email:'bg-emerald-500', discord:'bg-[#5865F2]', facebook:'bg-[#1877F2]', 'Internet Identity':'bg-violet-600' }

export default function ProfileMenu(){
  const { user, logout, myOrders, myRegs, myTeams, isVipActive } = useAuth()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  if(!user) return null

  const orders = myOrders()
  const regs = myRegs()
  const owTeams = myTeams()
  const teamNames = new Set([...owTeams.map(x=>x.name), ...regs.map(r=>r.team)].filter(Boolean))
  const xp = user.xp != null ? Number(user.xp) : xpForActivity({ orders: orders.length, regs: regs.length, teams: owTeams.length })
  const { level, cur, need } = levelProgress(xp)
  const phone = user.phone || orders[0]?.customer?.phone || ''
  const pct = Math.min(100, Math.round((cur / need) * 100))

  const rows = [
    { to:'/profile', icon:<User size={16}/>, label: t('pm_profile')||'Profil' },
    { to:'/orders#mytournaments', icon:<Trophy size={16}/>, label: t('pm_mytournaments')||'Mes Tournois', badge: regs.length||null },
    { to:'/orders#myteam', icon:<Shield size={16}/>, label: t('pm_myteam')||'Mon Équipe', badge: teamNames.size||null },
    { to:'/orders#wallet', icon:<Wallet size={16}/>, label: t('pm_wallet')||'Portefeuille', badge: Number(user.balance||0)>0?`${Number(user.balance||0)}`:null },
    { to:'/orders#xp', icon:<Gift size={16}/>, label: t('pm_xp')||'XP & Récompenses', badge: `${xp}` },
    { to:'/orders#riot', icon:<Gamepad2 size={16}/>, label: 'Compte Riot', badge: user.riot ? (user.riot.game==='lol'?'LoL':'Valo') : null },
    { to:'/orders#orders', icon:<ShoppingBag size={16}/>, label: t('pm_orders')||'Commandes', badge: orders.length||null },
    { to:'/orders#settings', icon:<Settings size={16}/>, label: t('pm_settings')||'Paramètres' },
    { to:'/support', icon:<Flag size={16}/>, label: t('pm_bug')||'Signaler un bug' },
  ]

  return (
    <div className="relative hidden lg:block" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 hover:bg-white/5 rounded-xl px-1 py-1">
        {user.avatar
          ? <img src={user.avatar} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover"/>
          : <div className={`w-8 h-8 rounded-full ${providerColor[user.provider]||'bg-lime-600'} flex items-center justify-center font-black text-sm text-black`}>{(user.name||user.email||'?')[0].toUpperCase()}</div>}
        <div className="text-xs leading-tight text-left">
          <div className="text-white font-bold truncate max-w-[120px] flex items-center gap-1">
            {user.name || user.email || user.principal?.slice(0,12)}
            {isVipActive() && <Crown size={13} className="text-amber-300 shrink-0"/>}
          </div>
          <div className="text-white/50">Nv.{level}</div>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-2 w-[280px] z-50">
          <div className="rounded-2xl overflow-hidden bg-[#121214] border border-white/10 shadow-2xl">
            {user.banner && <img src={user.banner} alt="" loading="lazy" decoding="async" className="w-full h-[70px] object-cover"/>}
            <div className="p-4 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center gap-3">
                {user.avatar
                  ? <img src={user.avatar} alt="" loading="lazy" decoding="async" className="w-11 h-11 rounded-full object-cover"/>
                  : <div className={`w-11 h-11 rounded-full ${providerColor[user.provider]||'bg-lime-600'} flex items-center justify-center font-black text-lg text-black`}>{(user.name||user.email||'?')[0].toUpperCase()}</div>}
                <div className="min-w-0">
                  <div className="font-black truncate">{user.name || 'Joueur'}</div>
                  <div className="text-[11px] text-white/50 truncate">{user.email||''}{phone?` • ${phone}`:''}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-black">Niveau {level}</span>
                <span className="text-white/50">{cur} / {need} XP</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${pct}%` }}/>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-black/40 border border-white/10 py-2"><div className="font-black text-amber-300">{Number(user.balance||0)}</div><div className="text-[10px] text-white/50">{t('pm_coins')||'Pièces'}</div></div>
                <div className="rounded-xl bg-black/40 border border-white/10 py-2"><div className="font-black text-emerald-300">{regs.length}</div><div className="text-[10px] text-white/50">{t('pm_tournaments')||'Tournois'}</div></div>
                <div className="rounded-xl bg-black/40 border border-white/10 py-2"><div className="font-black text-teal-300">{teamNames.size}</div><div className="text-[10px] text-white/50">{t('pm_teams')||'Équipes'}</div></div>
              </div>
            </div>
            <div className="py-1.5">
              {rows.map(r=>(
                <Link key={r.label} to={r.to} onClick={()=>setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white">
                  <span className="text-white/50">{r.icon}</span>{r.label}
                  {r.badge!=null && <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/10 font-bold">{r.badge}</span>}
                </Link>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 font-bold"><LogOut size={16}/>{t('logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
