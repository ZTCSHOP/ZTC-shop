import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Shield, LogOut, MessageCircle, Trophy, Search, Menu, Gamepad2, Globe, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang, LANGS } from '../context/LanguageContext'
import { useState } from 'react'
import ProfileMenu from './ProfileMenu'
import NotificationBell from './NotificationBell'

export default function Navbar({ onBurger }){
  const { count } = useCart()
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const dashboard = pathname === '/'
  const [q, setQ] = useState('')
  const logoUrl = `${import.meta.env.BASE_URL}ztc-gaming-logo.jpg`
  const goSearch = (e)=>{ e.preventDefault(); nav(`/catalog?q=${encodeURIComponent(q.trim())}`) }
  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur ${dashboard ? 'ztc-home-header border-[#e7e9ed] bg-white/95' : 'border-white/10 bg-[#0a0a0c]/90'}`}>
      <div className={`${dashboard ? 'mx-auto max-w-[1900px] px-3 sm:px-5' : 'mx-auto max-w-[1760px] px-2 sm:px-4'} relative flex h-16 items-center gap-2 sm:gap-3`}>
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <img src={logoUrl} alt="ZTC-GAMING" className={`h-11 w-11 rounded-xl object-cover ${dashboard ? 'border border-[#e5e7eb]' : 'border border-amber-300/40'}`}/>
          <span className={`hidden font-display text-2xl tracking-wide sm:inline ${dashboard ? 'text-[#17191d]' : 'nav-brand'}`}>ZTC<span className={dashboard ? 'text-[#bd882b]' : 'text-inherit'}>-GAMING</span></span>
        </Link>
        <button onClick={onBurger} className={`rounded-xl border p-2.5 lg:hidden ${dashboard ? 'border-[#e5e7eb] bg-white text-[#343840] hover:bg-[#f5f6f7]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`} aria-label="Menu">
          <Menu size={18}/>
        </button>
        <form onSubmit={goSearch} className="hidden md:flex flex-1 max-w-xl mx-2 relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dashboard ? 'text-[#8b9098]' : 'text-white/40'}`}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search for tournaments, teams, players..." className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm focus:outline-none ${dashboard ? 'border-[#e6e8ec] bg-[#f7f8fa] text-[#252930] placeholder:text-[#9297a0] focus:border-[#d3b36c]' : 'border-white/10 bg-white/5 focus:border-lime-400/60'}`}/>
        </form>
        <div className="flex-1 md:hidden" />
        {/* Tournois + Équipes + Support */}
        {!dashboard && <>
          <Link to="/teams" title="Teams" className="nav-gold hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold sm:flex"><Shield size={16}/> Teams</Link>
          <Link to="/tournaments" title="Tournaments" className="nav-gold hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold sm:flex"><Trophy size={16}/> Tournaments</Link>
          <Link to="/recrutement" title="E-Sports" className="nav-gold hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold sm:flex"><Gamepad2 size={16}/> E-Sports</Link>
          <Link to="/support" title="Support" className="nav-gold relative flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black sm:px-3">
            <MessageCircle size={17} className="animate-support-bounce"/><span className="hidden sm:inline">Support</span>
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full border-2 border-[#0a0a0c] bg-amber-400"/>
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0a0a0c] bg-amber-400"/>
          </Link>
        </>}
        {/* Lang switcher : compact, se déploie au survol de la souris */}
        <div className="relative group">
          <button className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-black sm:px-3 ${dashboard ? 'border-[#e6e8ec] bg-white text-[#343840] hover:bg-[#f6f7f8]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`} aria-label={t('st_lang')}>
            <Globe size={15} className={dashboard ? 'text-[#bd882b]' : 'text-lime-400'}/>
            <span>{lang.toUpperCase()}</span>
            <ChevronDown size={13} className={`${dashboard ? 'text-[#858a93]' : 'text-white/50'} transition-transform group-hover:rotate-180`}/>
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
        {!dashboard && <Link to="/cart" className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
          <ShoppingCart size={18}/>{count>0 && <span key={count} className="badge-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1 text-[11px] font-bold text-black">{count}</span>}
        </Link>}
        {user ? (
          <div className="flex items-center gap-2">
            {user.isAdmin && <Link to="/admin" className="rounded-xl border border-amber-500/30 bg-amber-500/20 p-2.5 text-amber-400"><Shield size={18}/></Link>}
            {!dashboard && <button onClick={logout} title={t('logout')} className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"><LogOut size={16}/></button>}
            <Link to="/profile" title={t('profile')} className={`rounded-xl p-2.5 lg:hidden ${dashboard ? 'border border-[#e6e8ec] bg-white text-[#343840]' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}><User size={18}/></Link>
            <ProfileMenu />
          </div>
        ) : (
          <Link to="/login" className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-black sm:px-4 ${dashboard ? 'bg-[#c89535] text-white hover:bg-[#b98426]' : 'bg-lime-400 hover:bg-lime-300'}`}>
            <User size={16}/> {t('login')}
          </Link>
        )}
      </div>
      <div className={`md:hidden ${dashboard ? 'border-t border-[#eceef1]' : 'border-t border-white/10'}`}>
        <form onSubmit={goSearch} className="px-4 py-2 relative">
          <Search size={16} className={`absolute left-7 top-1/2 -translate-y-1/2 ${dashboard ? 'text-[#8b9098]' : 'text-white/40'}`}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search for tournaments, teams, players..." className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm focus:outline-none ${dashboard ? 'border-[#e6e8ec] bg-[#f7f8fa] text-[#252930] placeholder:text-[#9297a0]' : 'border-white/10 bg-white/5 focus:border-lime-400/60'}`}/>
        </form>
      </div>
      {/* Accès rapide mobile : Équipes + Tournois + Recrutement (comme sur PC) */}
      {!dashboard && <div className="border-t border-white/10 sm:hidden">
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          <Link to="/teams" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Shield size={14}/> Teams
          </Link>
          <Link to="/tournaments" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Trophy size={14}/> Tournaments
          </Link>
          <Link to="/recrutement" className="nav-gold flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap">
            <Gamepad2 size={14}/> E-Sports
          </Link>
        </div>
      </div>}
    </header>
  )
}
