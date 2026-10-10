import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Shield, LogOut, MessageCircle, Trophy, Home, Search, Menu, Gamepad2, Crown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang, LANGS } from '../context/LanguageContext'
import { useState } from 'react'

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
        <Link to="/teams" title={t('teams')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-sm font-bold">
          <Shield size={16}/> {t('teams')}
        </Link>
        <Link to="/tournaments" title={t('tournaments')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-sm font-bold">
          <Trophy size={16}/> {t('tournaments')}
        </Link>
        <Link to="/recrutement" title={t('recrutement')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/15 border border-red-500/30 hover:bg-red-600/25 text-red-300 text-sm font-bold">
          <Gamepad2 size={16}/> {t('recrutement')}
        </Link>
        <Link to="/support" title={t('support')}
          className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:brightness-110 text-white text-sm font-black animate-support-ring">
          <MessageCircle size={17} className="animate-support-bounce"/>
          <span className="hidden sm:inline">{t('support')}</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a0a0c] animate-ping"/>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a0a0c]"/>
        </Link>
        {/* Lang switcher */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {LANGS.map(l=>(
            <button key={l.id} onClick={()=>setLang(l.id)} title={l.label}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black ${lang===l.id?'bg-lime-400 text-black':'text-white/60 hover:text-white'}`}>
              {l.id.toUpperCase()}
            </button>
          ))}
        </div>
        <Link to="/cart" className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
          <ShoppingCart size={18}/>
          {count>0 && <span key={count} className="badge-pop absolute -top-1.5 -right-1.5 bg-lime-400 text-black text-[11px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">{count}</span>}
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            {user.isAdmin && <Link to="/admin" className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400"><Shield size={18}/></Link>}
            <button onClick={logout} title={t('logout')} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"><LogOut size={16}/></button>
            <Link to="/orders" title={t('profile')} className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"><User size={18}/></Link>
            <Link to="/orders" title={t('profile')} className="hidden lg:flex items-center gap-2 hover:bg-white/5 rounded-xl px-1 py-1">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover"/>
                : <div className={`w-8 h-8 rounded-full ${providerColor[user.provider]||'bg-lime-600'} flex items-center justify-center font-black text-sm text-black`}>{(user.name||user.email||'?')[0].toUpperCase()}</div>
              }
              <div className="text-xs leading-tight">
                <div className="text-white font-bold truncate max-w-[120px] flex items-center gap-1">
                  {user.name || user.email || user.principal?.slice(0,12)}
                  {isVipActive() && <Crown size={13} className="text-amber-300 shrink-0"/>}
                </div>
                <div className="text-white/50">{providerLabel[user.provider]||user.provider}</div>
              </div>
            </Link>
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
    </header>
  )
}
