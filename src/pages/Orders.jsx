import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import XpRewards from '../components/XpRewards'
import RiotCard from '../components/RiotCard'
import { MyTournaments, MyTeam, ProfileSettings, VipCard, Wallet, OrdersList } from '../components/member/MemberPanels'

export default function Orders(){
  const { user, refreshMyBalance } = useAuth()
  const { t } = useLang()
  useEffect(()=>{ try{ refreshMyBalance() }catch{} }, [])
  if(!user) return <div className="max-w-[800px] mx-auto px-4 py-16 text-center">{t('login_required')}<br/><Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link></div>
  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-lime-300 mb-2">← {t('dash_title')||'Mon Espace Membre'}</Link>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide">{t('profile')}</h1>
      <p className="text-sm text-white/50">{user.provider}</p>
      <div className="mt-6"><VipCard /></div>
      <div className="mt-6"><XpRewards /></div>
      <div className="mt-6"><RiotCard /></div>
      <div className="mt-6"><MyTournaments /></div>
      <div className="mt-6"><MyTeam /></div>
      <div className="mt-6"><Wallet /></div>
      <div className="mt-6"><ProfileSettings /></div>
      <div className="mt-6"><OrdersList /></div>
    </div>
  )
}
