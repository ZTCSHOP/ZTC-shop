import { Link } from 'react-router-dom'
import { ShoppingCart, User, Shield, LogOut, MessageCircle, Info, Trophy, Home, Gamepad2, KeyRound, Gift, Crown, Sparkles, Monitor, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang, LANGS } from '../context/LanguageContext'
import { MENUS, initialProducts, categories } from '../data/products'

const providerLabel = { email:'Email', discord:'Discord', facebook:'Facebook', 'Internet Identity':'Internet Identity' }
const providerColor = { email:'bg-emerald-500', discord:'bg-[#5865F2]', facebook:'bg-[#1877F2]', 'Internet Identity':'bg-violet-600' }
const MENU_ICONS = { Gamepad2, KeyRound, User, Gift, Crown, Sparkles, Monitor }

export default function Navbar(){
  const { count } = useCart()
  const { user, logout, products: dbProducts } = useAuth()
  const { lang, setLang, t } = useLang()
  const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`
  const allProds = dbProducts || initialProducts
  const prodById = Object.fromEntries(allProds.map(p=> [p.id, p]))
  const visibleMenus = MENUS.filter(m=> m.products.length>0 || (m.children||[]).length>0)
  const catName = (id)=> categories.find(c=>c.id===id)?.label||id
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[#0a0a0c]/90 border-b border-white/10">
      <div className="max-w-[1536px] mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <img src={logoUrl} alt="ZTC Shop" className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 border border-white/20"/>
          <span className="hidden sm:inline font-display text-2xl tracking-wide">ZTC<span className="text-lime-400"> SHOP</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 ml-4 text-sm text-white/70">
          <Link to="/" className="hover:text-white flex items-center gap-1"><Home size={15}/></Link>
          {visibleMenus.map(m=>{
            const Icon = MENU_ICONS[m.icon] || Gift
            const mainLink = m.products.length>0 ? `/catalog?menu=${m.id}` : `/catalog?cat=${(m.children||[])[0]||''}`
            return (
              <div key={m.id} className="relative group">
                <Link to={mainLink} className="flex items-center gap-1.5 py-4 text-white font-semibold hover:text-lime-400 transition">
                  <Icon size={15}/>{m.label[lang]||m.label.en}<ChevronDown size={12} className="opacity-60"/>
                </Link>
                <div className="absolute top-full left-0 min-w-[220px] pt-2 hidden group-hover:block">
                <div className="rounded-2xl bg-[#141417] border border-white/10 shadow-2xl p-2">
                  {(m.children||[]).map(cid=>(
                    <Link key={cid} to={`/catalog?cat=${cid}`} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-[13px] font-bold">
                      <span className="w-8 h-8 rounded-lg bg-lime-400/20 text-lime-300 flex items-center justify-center text-xs font-black">{catName(cid)[0]}</span>
                      <span className="truncate">{catName(cid)}</span>
                    </Link>
                  ))}
                  {m.products.map(pid=> prodById[pid] && (
                    <Link key={pid} to={`/product/${pid}`} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white text-[13px]">
                      {prodById[pid].image
                        ? <img src={prodById[pid].image} alt="" className="w-8 h-8 rounded-lg object-cover"/>
                        : <span className="w-8 h-8 rounded-lg bg-lime-400 text-black/30 flex items-center justify-center text-xs font-black">{prodById[pid].name[0]}</span>}
                      <span className="truncate">{prodById[pid].name}</span>
                    </Link>
                  ))}
                  <Link to={`/catalog?menu=${m.id}`} className="block text-center mt-1 px-3 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-[13px] font-bold">Tout voir →</Link>
                </div>
                </div>
              </div>
            )
          })}
        </nav>
        <div className="flex-1" />
        {/* Tournois + Équipes + Support */}
        <Link to="/teams" title={t('teams')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-bold">
          <Shield size={16}/> {t('teams')}
        </Link>
        <Link to="/tournaments" title={t('tournaments')} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-sm font-bold">
          <Trophy size={16}/> {t('tournaments')}
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
                <div className="text-white font-bold truncate max-w-[120px]">{user.name || user.email || user.principal?.slice(0,12)}</div>
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
        <div className="max-w-[1536px] mx-auto px-4 py-2 flex gap-2 overflow-x-auto text-[13px] text-white/70">
          <Link to="/" className="flex items-center gap-1 whitespace-nowrap px-2 py-1"><Home size={14}/></Link>
          {visibleMenus.map(m=>{ const Icon = MENU_ICONS[m.icon] || Gift; const ml = m.products.length>0 ? `/catalog?menu=${m.id}` : `/catalog?cat=${(m.children||[])[0]||''}`; return (
            <Link key={m.id} to={ml} className="flex items-center gap-1 whitespace-nowrap px-2 py-1 text-white font-semibold"><Icon size={14}/>{m.label[lang]||m.label.en}</Link>
          )})}
        </div>
      </div>
    </header>
  )
}
