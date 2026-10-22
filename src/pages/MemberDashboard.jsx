import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Bell, CalendarDays, Coins, Gamepad2, Gift, Package, User, UserPlus, Users, Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { xpForActivity } from '../lib/level'
import MemberSidebar from '../components/MemberSidebar'

const CARD_STYLES = {
  gold: {
    box: 'bg-[#0b0c12]/75 border-amber-400/35 bg-gradient-to-br from-amber-400/[0.14] via-amber-500/[0.05] to-transparent hover:border-amber-300/70 hover:shadow-[0_0_45px_-14px_rgba(245,190,70,.65)]',
    icon: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
    chip: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    arrow: 'border-amber-400/40 text-amber-300 group-hover:bg-amber-400 group-hover:text-black',
  },
  red: {
    box: 'bg-[#0b0c12]/75 border-red-500/35 bg-gradient-to-br from-red-500/[0.14] via-red-500/[0.05] to-transparent hover:border-red-400/70 hover:shadow-[0_0_45px_-14px_rgba(239,68,68,.6)]',
    icon: 'border-red-400/50 bg-red-500/10 text-red-300',
    chip: 'border-red-400/40 bg-red-500/10 text-red-200',
    arrow: 'border-red-400/40 text-red-300 group-hover:bg-red-500 group-hover:text-white',
  },
  violet: {
    box: 'bg-[#0b0c12]/75 border-violet-500/35 bg-gradient-to-br from-violet-500/[0.14] via-violet-500/[0.05] to-transparent hover:border-violet-400/70 hover:shadow-[0_0_45px_-14px_rgba(168,85,247,.6)]',
    icon: 'border-violet-400/50 bg-violet-500/10 text-violet-300',
    chip: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
    arrow: 'border-violet-400/40 text-violet-300 group-hover:bg-violet-500 group-hover:text-white',
  },
  teal: {
    box: 'bg-[#0b0c12]/75 border-teal-500/35 bg-gradient-to-br from-teal-500/[0.14] via-teal-500/[0.05] to-transparent hover:border-teal-400/70 hover:shadow-[0_0_45px_-14px_rgba(45,212,191,.6)]',
    icon: 'border-teal-400/50 bg-teal-500/10 text-teal-300',
    chip: 'border-teal-400/40 bg-teal-500/10 text-teal-200',
    arrow: 'border-teal-400/40 text-teal-300 group-hover:bg-teal-500 group-hover:text-black',
  },
  orange: {
    box: 'bg-[#0b0c12]/75 border-orange-500/35 bg-gradient-to-br from-orange-500/[0.14] via-orange-500/[0.05] to-transparent hover:border-orange-400/70 hover:shadow-[0_0_45px_-14px_rgba(249,115,22,.6)]',
    icon: 'border-orange-400/50 bg-orange-500/10 text-orange-300',
    chip: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
    arrow: 'border-orange-400/40 text-orange-300 group-hover:bg-orange-500 group-hover:text-black',
  },
  pink: {
    box: 'bg-[#0b0c12]/75 border-pink-500/35 bg-gradient-to-br from-pink-500/[0.14] via-pink-500/[0.05] to-transparent hover:border-pink-400/70 hover:shadow-[0_0_45px_-14px_rgba(236,72,153,.6)]',
    icon: 'border-pink-400/50 bg-pink-500/10 text-pink-300',
    chip: 'border-pink-400/40 bg-pink-500/10 text-pink-200',
    arrow: 'border-pink-400/40 text-pink-300 group-hover:bg-pink-500 group-hover:text-white',
  },
  rose: {
    box: 'bg-[#0b0c12]/75 border-rose-500/35 bg-gradient-to-br from-rose-500/[0.14] via-rose-500/[0.05] to-transparent hover:border-rose-400/70 hover:shadow-[0_0_45px_-14px_rgba(244,63,94,.6)]',
    icon: 'border-rose-400/50 bg-rose-500/10 text-rose-300',
    chip: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
    arrow: 'border-rose-400/40 text-rose-300 group-hover:bg-rose-500 group-hover:text-white',
  },
  sky: {
    box: 'bg-[#0b0c12]/75 border-sky-500/35 bg-gradient-to-br from-sky-500/[0.14] via-sky-500/[0.05] to-transparent hover:border-sky-400/70 hover:shadow-[0_0_45px_-14px_rgba(56,189,248,.6)]',
    icon: 'border-sky-400/50 bg-sky-500/10 text-sky-300',
    chip: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
    arrow: 'border-sky-400/40 text-sky-300 group-hover:bg-sky-500 group-hover:text-black',
  },
}

export default function MemberDashboard(){
  const { user, myOrders, myRegs, myTeams, isVipActive, refreshMyBalance, unreadNotifications } = useAuth()
  const { t } = useLang()
  useEffect(()=>{ try{ refreshMyBalance() }catch{} }, [])
  if(!user) return (
    <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-black">{t('login_required')}</h2>
      <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link>
    </div>
  )

  const orders = myOrders()
  const regs = myRegs()
  const owTeams = myTeams()
  const teamNames = new Set([...owTeams.map(x=>x.name), ...regs.map(r=>r.team)].filter(Boolean))
  const xp = user.xp != null ? Number(user.xp) : xpForActivity({ orders: orders.length, regs: regs.length, teams: owTeams.length })
  const balance = Number(user.balance || 0)
  const riotLabel = user.riot ? (user.riot.game === 'lol' ? 'LoL' : 'Valorant') : null

  const cards = [
    { to:'/profile/wallet', icon:Coins, color:'gold', title:t('pm_coins')||'Coins', desc:t('dash_coins_d'), stat:balance },
    { to:'/tournaments', icon:CalendarDays, color:'red', title:t('pm_tournaments')||'Tournois', desc:t('dash_tournaments_d') },
    { to:'/profile/mytournaments', icon:CalendarDays, color:'violet', title:t('pm_mytournaments')||'Mes Tournois', desc:t('dash_mytournaments_d'), stat:regs.length },
    { to:'/profile/myteam', icon:Users, color:'teal', title:t('pm_myteam')||'Mon Équipe', desc:t('dash_myteam_d'), stat:teamNames.size },
    { to:'/profile/wallet', icon:Wallet, color:'orange', title:t('pm_wallet')||'Portefeuille', desc:t('dash_wallet_d'), stat:`${balance}` },
    { to:'/profile/xp', icon:Gift, color:'pink', title:t('pm_xp')||'XP & Récompenses', desc:t('dash_xp_d'), stat:`${xp} XP` },
    { to:'/profile/riot', icon:Gamepad2, color:'rose', title:'Compte Riot', desc:t('dash_riot_d'), stat:riotLabel },
    { to:'/profile/orders', icon:Package, color:'sky', title:t('pm_orders')||'Commandes', desc:t('dash_orders_d'), stat:orders.length },
    { to:'/profile/notifications', icon:Bell, color:'gold', title:'Notifications', desc:'Commandes, tournois, récompenses et VIP — tout au même endroit.', stat:unreadNotifications||null },
    { to:'/profile/referral', icon:UserPlus, color:'teal', title:'Parrainage', desc:"Invite tes amis et gagne de l'XP à chaque inscription." },
  ]

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-6 items-start">
      <MemberSidebar active="profile"/>

      <section className="min-w-0">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <User size={20} className="text-lime-300"/>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">{t('dash_title')||'Mon Espace Membre'}</h1>
            <p className="text-sm text-white/50 max-w-2xl">{t('dash_sub')||'Gérez votre activité, suivez vos performances et accédez à tous vos contenus depuis votre profil.'}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(c=>{
            const Icon = c.icon
            const s = CARD_STYLES[c.color]
            return (
              <Link key={c.title+c.to} to={c.to} className={`group relative overflow-hidden rounded-2xl border p-5 min-h-[192px] flex flex-col transition-all duration-300 ${s.box}`}>
                <Icon className="absolute -right-7 -top-7 w-32 h-32 opacity-[0.07] pointer-events-none" strokeWidth={1.5}/>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${s.icon}`}><Icon size={22}/></div>
                  {c.stat!=null && c.stat!=='' && (
                    <span className={`text-[11px] font-black px-2 py-1 rounded-full border whitespace-nowrap ${s.chip}`}>{c.stat}</span>
                  )}
                </div>
                <h2 className="mt-4 text-lg font-black leading-tight">{c.title}</h2>
                <p className="mt-1 text-[12.5px] leading-snug text-white/55">{c.desc}</p>
                <div className="mt-auto pt-4 flex justify-end">
                  <span className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${s.arrow}`}>
                    <ArrowRight size={15}/>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
