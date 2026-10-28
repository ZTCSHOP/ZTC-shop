import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Gamepad2, KeyRound, User, Gift, Crown, Sparkles, Monitor, X, LayoutGrid, Trophy, MessageCircle, Info, ChevronDown, BarChart3, Users } from 'lucide-react'
import { MENUS, initialProducts, categories } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { GAMES } from '../lib/games'

const MENU_ICONS = { Gamepad2, KeyRound, User, Gift, Crown, Sparkles, Monitor }

export default function Sidebar({ mobileOpen, onClose }){
  const { pathname } = useLocation()
  const { products: dbProducts } = useAuth()
  const { lang } = useLang()
  const allProds = dbProducts || initialProducts
  const prodById = Object.fromEntries(allProds.map(p=> [p.id, p]))
  const catName = (id)=> categories.find(c=>c.id===id)?.label||id
  const visibleMenus = MENUS.filter(m=> m.products.length>0 || (m.children||[]).length>0)
  const [open, setOpen] = useState('giftcards')
  const toggle = (id)=> setOpen(o=> o===id ? null : id)
  const dashboardLinks = [
    { to:'/', icon:Home, label:'Home' },
    { to:'/tournaments', icon:Trophy, label:'Tournaments' },
    { to:'/teams', icon:Users, label:'Teams' },
    { to:'/leaderboard', icon:BarChart3, label:'Players' },
    { to:'/catalog', icon:LayoutGrid, label:'Store' },
    { to:'/profile/wallet', icon:Gift, label:'Wallet' },
    { to:'/profile/xp', icon:Gift, label:'Rewards' },
  ]

  if(pathname === '/') return (
    <>
      <aside className="ztc-home-sidebar hidden w-[176px] shrink-0 border-r border-[#e7e9ed] bg-white lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]">
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {dashboardLinks.map(item=>{
              const Icon = item.icon
              const active = pathname === item.to
              return <Link key={item.label} to={item.to} onClick={onClose} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition ${active ? 'bg-[#f7f1e4] text-[#a87319]' : 'text-[#333840] hover:bg-[#f5f6f7]'}`}>
                {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-[#c89535]"/>}
                <Icon size={16} className={active ? 'text-[#bd882b]' : 'text-[#555b64]'}/>{item.label}
              </Link>
            })}
          </nav>
          <div className="mt-5 border-t border-[#eceef1] pt-4">
            <div className="px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#838994]">Main games</div>
            <div className="space-y-0.5">
              {['valorant','lol','cs2','r6','fc27','tekken8'].map(id=>GAMES.find(game=>game.id===id)).filter(Boolean).map(game=>(
                <Link key={game.id} to={`/tournaments?game=${game.id}`} onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-medium text-[#555b64] transition hover:bg-[#f5f6f7] hover:text-[#aa781d]">
                  <span className="flex h-5 w-5 items-center justify-center text-sm" aria-hidden="true">{game.icon}</span><span className="truncate">{game.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <Link to="/lfg" onClick={onClose} className="mt-auto overflow-hidden rounded-lg bg-[#12161c] p-3 text-white">
            <div className="text-[10px] font-extrabold text-[#e2bd70]">ZTC COMMUNITY</div>
            <div className="mt-1 text-[9px] text-white/65">Play · Compete · Win</div>
            <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#c89535]"><ChevronDown size={13} className="-rotate-90"/></span>
          </Link>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/45"/>
        <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#eceef1] px-4 py-4">
            <span className="font-display text-xl font-black text-[#181a1f]">ZTC <span className="text-[#bd882b]">GAMING</span></span>
            <button onClick={onClose} className="rounded-lg p-2 text-[#50545c] hover:bg-[#f3f4f6]"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {dashboardLinks.map(item=>{
                const Icon = item.icon
                const active = pathname === item.to
                return <Link key={item.label} to={item.to} onClick={onClose} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${active ? 'bg-[#f7f1e4] text-[#a87319]' : 'text-[#333840] hover:bg-[#f5f6f7]'}`}><Icon size={17}/>{item.label}</Link>
              })}
            </nav>
            <div className="mt-5 border-t border-[#eceef1] pt-4">
              <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-[#838994]">Main games</div>
              {['valorant','lol','cs2','r6','fc27','tekken8'].map(id=>GAMES.find(game=>game.id===id)).filter(Boolean).map(game=><Link key={game.id} to={`/tournaments?game=${game.id}`} onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#555b64] hover:bg-[#f5f6f7]"><span>{game.icon}</span>{game.label}</Link>)}
            </div>
          </div>
        </aside>
      </div>}
    </>
  )

  const body = (
    <div className="p-3 space-y-1 overflow-y-auto h-full">
      <Link to="/" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm">
        <Home size={17} className="text-lime-400"/> Accueil
      </Link>
      <Link to="/catalog" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm">
        <LayoutGrid size={17} className="text-lime-400"/> Catalogue
      </Link>
      <div className="pt-2 space-y-4">
        {visibleMenus.map(m=>{
          const Icon = MENU_ICONS[m.icon] || Gift
          const expanded = open===m.id
          const mainLink = m.products.length>0 ? `/catalog?menu=${m.id}` : `/catalog?cat=${(m.children||[])[0]||''}`
          return (
            <div key={m.id} className={`rounded-xl border transition ${expanded?'bg-white/[0.04] border-white/10':'border-transparent'}`}>
              <div className="flex items-center gap-1 px-2 py-1">
                <Link to={mainLink} onClick={onClose} className="flex-1 flex items-center gap-2 px-1.5 py-2 rounded-lg hover:bg-white/10 min-w-0">
                  <Icon size={15} className="text-lime-400 shrink-0"/>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/70 truncate">{m.label[lang]||m.label.en}</span>
                </Link>
                <button onClick={()=>toggle(m.id)} aria-label="Réduire/étendre" className="p-2 rounded-lg hover:bg-white/10 text-white/60">
                  <ChevronDown size={15} className={`transition-transform ${expanded?'rotate-180':''}`}/>
                </button>
              </div>
              {expanded && (
              <div className="space-y-0.5 px-2 pb-2">
                {(m.children||[]).map(cid=>(
                  <Link key={cid} to={`/catalog?cat=${cid}`} onClick={onClose} className="block px-3 py-2 pl-9 rounded-xl hover:bg-white/10 text-[13px] text-white/75 hover:text-white truncate">{catName(cid)}</Link>
                ))}
                {m.products.map(pid=> prodById[pid] && (
                  <Link key={pid} to={`/product/${pid}`} onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-[13px] text-white/75 hover:text-white">
                    {prodById[pid].image
                      ? <img src={prodById[pid].image} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0"/>
                      : <span className="w-7 h-7 rounded-lg bg-lime-400/20 text-lime-300 flex items-center justify-center text-[11px] font-black shrink-0">{prodById[pid].name[0]}</span>}
                    <span className="truncate">{prodById[pid].name}</span>
                  </Link>
                ))}
              </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
        <Link to="/tournaments" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-amber-300"><Trophy size={17}/> Tournois</Link>
        <Link to="/leaderboard" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-amber-300"><BarChart3 size={17}/> Classements</Link>
        <Link to="/lfg" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-violet-300"><Users size={17}/> LFG / Équipes</Link>
        <Link to="/support" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-emerald-300"><MessageCircle size={17}/> Support</Link>
        <Link to="/about" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-white/70"><Info size={17}/> À propos</Link>
      </div>
    </div>
  )

  if(pathname === '/profile' || pathname.startsWith('/profile/')) return null

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] border-r border-white/10 bg-black/30">
        {body}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
          <aside className="absolute inset-y-0 left-0 w-72 bg-[#101310] border-r border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="font-display text-xl font-bold">ZTC<span className="text-lime-400"> SHOP</span></span>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-hidden">{body}</div>
          </aside>
        </div>
      )}
    </>
  )
}
