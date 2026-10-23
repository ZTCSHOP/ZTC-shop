import { Link } from 'react-router-dom'
import { Award, BarChart3, Bell, Crown, Gamepad2, Gift, LogOut, Package, Settings, Shield, ShoppingBag, SlidersHorizontal, Swords, Target, Trophy, User, UserPlus, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { levelProgress, xpForActivity } from '../lib/level'

const providerColor = { email:'bg-emerald-500', discord:'bg-[#5865F2]', facebook:'bg-[#1877F2]', 'Internet Identity':'bg-violet-600' }

export default function MemberSidebar({ active = 'profile' }){
  const { user, logout, myOrders, myRegs, myTeams, isVipActive, refreshMyBalance, unreadNotifications, badges } = useAuth()
  const { t } = useLang()
  if(!user) return null

  const orders = myOrders()
  const regs = myRegs()
  const owTeams = myTeams()
  const teamNames = new Set([...owTeams.map(x=>x.name), ...regs.map(r=>r.team)].filter(Boolean))
  const xp = user.xp != null ? Number(user.xp) : xpForActivity({ orders: orders.length, regs: regs.length, teams: owTeams.length })
  const { level, cur, need } = levelProgress(xp)
  const pct = Math.min(100, Math.round((cur / need) * 100))
  const balance = Number(user.balance || 0)
  const vip = isVipActive()
  const riotLabel = user.riot ? (user.riot.game === 'lol' ? 'LoL' : 'Valorant') : null

  const nav = [
    { key:'profile', to:'/profile', icon:User, label:t('pm_profile')||'Profil' },
    { key:'missions', to:'/profile/missions', icon:Target, label:'Missions du jour' },
    { key:'badges', to:'/profile/badges', icon:Award, label:'Badges', badge:badges.length||null },
    { key:'orders', to:'/profile/orders', icon:Package, label:t('pm_orders')||'Commandes', badge:orders.length||null },
    { key:'mytournaments', to:'/profile/mytournaments', icon:Trophy, label:t('pm_mytournaments')||'Mes Tournois', badge:regs.length||null },
    { key:'myteam', to:'/profile/myteam', icon:Shield, label:t('pm_myteam')||'Mon Équipe', badge:teamNames.size||null },
    { key:'wallet', to:'/profile/wallet', icon:Wallet, label:t('pm_wallet')||'Portefeuille', badge:balance||null },
    { key:'xp', to:'/profile/xp', icon:Gift, label:t('pm_xp')||'XP & Récompenses', badge:xp },
    { key:'riot', to:'/profile/riot', icon:Gamepad2, label:'Compte Riot', badge:riotLabel },
    { key:'notifications', to:'/profile/notifications', icon:Bell, label:'Notifications', badge:unreadNotifications||null },
    { key:'referral', to:'/profile/referral', icon:UserPlus, label:'Parrainage' },
    { key:'settings', to:'/profile/settings', icon:Settings, label:t('pm_settings')||'Paramètres' },
    { key:'preferences', to:'/profile/preferences', icon:SlidersHorizontal, label:'Préférences' },
    { key:'catalog', to:'/catalog', icon:ShoppingBag, label:'Boutique', outside:true },
    { key:'tournaments', to:'/tournaments', icon:Swords, label:'Tournois', outside:true },
    { key:'leaderboard', to:'/leaderboard', icon:BarChart3, label:'Classements', outside:true },
  ]

  return (
    <aside className="lg:sticky lg:top-20 w-full">
      <div className="rounded-3xl overflow-hidden bg-[#0c0d13]/90 backdrop-blur border border-white/10">
        {user.banner && <img src={user.banner} alt="" loading="lazy" decoding="async" className="w-full h-20 object-cover"/>}
        <div className={`px-5 pb-4 text-center ${user.banner ? '-mt-10' : 'pt-6'}`}>
          <div className="relative w-20 h-20 mx-auto">
            {user.avatar
              ? <img src={user.avatar} alt="" loading="lazy" decoding="async" className="w-20 h-20 rounded-full object-cover ring-2 ring-lime-400/70 ring-offset-2 ring-offset-[#0c0d13]"/>
              : <div className={`w-20 h-20 rounded-full ring-2 ring-lime-400/70 ring-offset-2 ring-offset-[#0c0d13] ${providerColor[user.provider]||'bg-lime-600'} flex items-center justify-center font-black text-2xl text-black`}>{(user.name||user.email||'?')[0].toUpperCase()}</div>}
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c0d13]"/>
          </div>
          <div className="mt-2 font-black text-lg truncate flex items-center justify-center gap-1.5">
            {user.name || user.email || 'Joueur'}
            {vip && <Crown size={15} className="text-amber-300 shrink-0"/>}
          </div>
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${vip ? 'border-amber-400/50 bg-amber-400/10 text-amber-300' : 'border-white/15 bg-white/5 text-white/60'}`}>
              {vip ? 'VIP' : (t('dash_member')||'Membre')}
            </span>
          </div>
          <div className="mt-4 text-left">
            <div className="flex items-center justify-between text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-lime-400 text-black font-black">Niv.{level}</span>
              <span className="text-white/50">{cur} / {need} XP</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-royal-500 to-lime-400 transition-all duration-700" style={{ width: `${pct}%` }}/>
            </div>
          </div>
        </div>
        <nav className="px-2 pb-2">
          {nav.map(item=>{
            const Icon = item.icon
            if(item.key===active) return (
              <div key={item.key} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-lime-400/15 to-transparent">
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-lime-400"/>
                <Icon size={16} className="text-lime-300"/>{item.label}
              </div>
            )
            return (
              <Link key={item.key} to={item.to} onClick={()=>{ try{ refreshMyBalance() }catch{} }} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition hover:bg-white/5 hover:text-white ${item.outside ? 'mt-1 text-white/50' : 'text-white/65'}`}>
                <Icon size={16} className="text-white/40"/>{item.label}
                {item.badge!=null && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-bold text-white/70">{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-white/10 space-y-1">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 font-bold">
            <LogOut size={16}/>{t('logout')}
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-[#0c0d13]/80 p-4 text-center">
        <p className="font-display text-xl tracking-wide text-white/80">YOU ARE NOT SOLO.</p>
        <p className="font-display text-xl tracking-wide text-lime-300">WE ARE ZTC.</p>
      </div>
    </aside>
  )
}
