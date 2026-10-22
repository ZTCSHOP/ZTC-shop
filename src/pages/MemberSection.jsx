import { Link, Navigate, useParams } from 'react-router-dom'
import { Gamepad2, Gift, Package, Settings, Shield, Trophy, Wallet as WalletIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import MemberSidebar from '../components/MemberSidebar'
import XpRewards from '../components/XpRewards'
import RiotCard from '../components/RiotCard'
import { MyTournaments, MyTeam, ProfileSettings, VipCard, Wallet, OrdersList } from '../components/member/MemberPanels'

const ICONS = { orders:Package, mytournaments:Trophy, myteam:Shield, wallet:WalletIcon, xp:Gift, riot:Gamepad2, settings:Settings }

export default function MemberSection(){
  const { section } = useParams()
  const { user, myTeams } = useAuth()
  const { t } = useLang()

  if(!user) return (
    <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-black">{t('login_required')}</h2>
      <Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link>
    </div>
  )

  const owned = myTeams()

  const META = {
    orders:         { title:t('pm_orders')||'Commandes',            desc:t('dash_orders_d') },
    mytournaments:  { title:t('pm_mytournaments')||'Mes Tournois',  desc:t('dash_mytournaments_d') },
    myteam:         { title:t('pm_myteam')||'Mon Équipe',           desc:t('dash_myteam_d') },
    wallet:         { title:t('pm_wallet')||'Portefeuille',         desc:t('dash_wallet_d') },
    xp:             { title:t('pm_xp')||'XP & Récompenses',         desc:t('dash_xp_d') },
    riot:           { title:'Compte Riot',                          desc:t('dash_riot_d') },
    settings:       { title:t('pm_settings_title')||'Paramètres du profil', desc:t('pm_settings_sub') },
  }

  if(!META[section]) return <Navigate to="/profile" replace/>
  if(section==='myteam' && owned.length===1) return <Navigate to={`/teams/${encodeURIComponent(owned[0].name)}`} replace/>

  const meta = META[section]
  const Icon = ICONS[section]

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-6 items-start">
      <MemberSidebar active={section}/>
      <section className="min-w-0">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-lime-300 mb-3">← {t('dash_title')||'Mon Espace Membre'}</Link>
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-lime-300"/>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide">{meta.title}</h1>
            <p className="text-sm text-white/50 max-w-2xl">{meta.desc}</p>
          </div>
        </div>

        {section==='orders' && <OrdersList/>}
        {section==='mytournaments' && <div className="grid gap-4"><MyTournaments/><Link to="/tournaments" className="inline-flex items-center gap-2 text-sm font-black text-lime-300 hover:text-lime-200">Découvrir tous les tournois →</Link></div>}
        {section==='myteam' && <MyTeam/>}
        {section==='wallet' && <div className="grid gap-4"><Wallet/><VipCard/></div>}
        {section==='xp' && <XpRewards/>}
        {section==='riot' && <RiotCard/>}
        {section==='settings' && <ProfileSettings hideHeader/>}
      </section>
    </div>
  )
}
