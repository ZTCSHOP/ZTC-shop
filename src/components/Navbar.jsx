import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Shield, LogOut, MessageCircle, Trophy, Home, Search, Menu, Gamepad2, Crown, Globe, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang, LANGS } from '../context/LanguageContext'
import { useState } from 'react'
import ProfileMenu from './ProfileMenu'
import NotificationBell from './NotificationBell'

const providerLabel = { email:'Email', discord:'Discord', facebook:'Facebook', 'Internet Identity':'Internet Identity' }
const providerColor = { email:'bg-emerald-500', discord:'bg-[#5865F2]', facebook:'bg-[#1877F2]', 'Internet Identity':'bg-violet-600' }

export default function Navbar({ onBurger }){
  const { count } = useCart()
  const { user, logout, isVipActive } = useAuth()
  const { lang, setLang, t } = useLang()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`
  const goSearch = (e)=>{ e.preventDefault(); nav(`/catalog?q=${encodeURIComponent(q.trim())}`) }
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[#0a0a0c]/90 border-b border-white/10">
      <div className="max-w-[1760px] mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <img src={logoUrl} alt="ZTC Shop" className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 border border-white/20"/>
          <span className="hidden sm:inline font-display text-2xl tracking-wide">ZTC<span className="text-lime-400"> SHOP</span></span>
        </Link>
        <button onClick={onBurger} className="lg:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10" aria-label="Menu">
          <Menu size={18}/>
        </button>
        <form onSubmit={goSearch} className="hidden md:flex flex-1 max-w-xl mx-2 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher jeux, gift cards, consola…" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-lime-400/60 text-sm"/>
        </form>
        <div className="flex-1 md:hidden" />
        {/* Tournois + Équipes + Support */}
        <Link to="/teams" title={t('teams')} className="nav-gold hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold">
          <Shield size={16} className="text-[#f6e2a6]"/> {t('teams')}
        </Link>
        <Link to="/tournaments" title={t('tournaments')} className="nav-gold hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold">
          <Trophy size={16} className="text-[#f6e2a6]"/> {t('tournaments')}
        </Link>
        <Link to="/recrutement" title={t('recrutement')} className="nav-gold hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold">
          <Gamepad2 size={16} className="text-[#f6e2a6]"/> {t('recrutement')}
        </Link>
        <Link to="/support" title={t('support')}
          className="nav-gold relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black">
          <MessageCircle size={17} className="text-[#f6e2a6] animate-support-bounce"/>
          <span className="hidden sm:inline">{t('support')}</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a0a0c] animate-ping"/>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a0a0c]"/>
        </Link>
        {/* Lang switcher : compact, se déploie au survol de la souris */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black" aria-label={t('st_lang')}>
            <Globe size={15} className="text-lime-400"/>
            <span>{lang.toUpperCase()}</span>
            <ChevronDown size={13} className="text-white/50 transition-transform group-hover:rotate-180"/>
          </button>
          <div className="absolute right-0 top-full z-50 pt-1.5 hidden group-hover:block">
            <div className="flex flex-col min-w-[96px] rounded-xl border border-white/15 bg-[#141417] shadow-xl overflow-hidden">
              {LANGS.map(l=>(
                <button key={l.id} onClick={()=>setLang(l.id)} title={l.label}
                  className={`text-left px-3 py-2 text-xs font-black hover:bg-white/10 ${lang===l.id ? 'text-lime-300' : 'text-white/70'}`}>
                  {l.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <NotificationBell />
        <Link to="/cart" className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
          <ShoppingCart size={18}/>
          {count>0 && <span key={count} className="badge-pop absolute -top-1.5 -right-1.5 bg-lime-400 text-black text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">{count}</span>}
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            {user.isAdmin && <Link to="/admin" className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400"><Shield size={18}/></Link>}
            <button onClick={logout} title={t('logout')} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"><LogOut size={16}/></button>
            <Link to="/profile" title={t('profile')} className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"><User size={18}/></Link>
            <ProfileMenu />
          </div>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-sm font-bold">
            <User size={16}/> {t('login')}
          </Link>
        )}
      </div>
      <div className="md:hidden border-t border-white/10">
        <form onSubmit={goSearch} className="px-4 py-2 relative">
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-lime-400/60 text-sm"/>
        </form>
      </div>
      {/* Accès rapide mobile : Équipes + Tournois + Recrutement (comme sur PC) */}
      <div className="sm:hidden border-t border-white/10">
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          <Link to="/teams" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Shield size={14} className="text-[#f6e2a6]"/> {t('teams')}
          </Link>
          <Link to="/tournaments" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Trophy size={14} className="text-[#f6e2a6]"/> {t('tournaments')}
          </Link>
          <Link to="/recrutement" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Gamepad2 size={14} className="text-[#f6e2a6]"/> {t('recrutement')}
          </Link>
        </div>
      </div>
    </header>
  )
}
