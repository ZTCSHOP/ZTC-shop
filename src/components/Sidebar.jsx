import { Link } from 'react-router-dom'
import { Home, Gamepad2, KeyRound, User, Gift, Crown, Sparkles, Monitor, X, LayoutGrid, Trophy, MessageCircle, Info } from 'lucide-react'
import { MENUS, initialProducts, categories } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

const MENU_ICONS = { Gamepad2, KeyRound, User, Gift, Crown, Sparkles, Monitor }

export default function Sidebar({ mobileOpen, onClose }){
  const { products: dbProducts } = useAuth()
  const { lang } = useLang()
  const allProds = dbProducts || initialProducts
  const prodById = Object.fromEntries(allProds.map(p=> [p.id, p]))
  const catName = (id)=> categories.find(c=>c.id===id)?.label||id
  const visibleMenus = MENUS.filter(m=> m.products.length>0 || (m.children||[]).length>0)

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
          return (
            <div key={m.id}>
              <div className="px-3 pb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40">
                <Icon size={13} className="text-lime-400"/>{m.label[lang]||m.label.en}
              </div>
              <div className="space-y-0.5">
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
            </div>
          )
        })}
      </div>
      <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
        <Link to="/tournaments" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-amber-300"><Trophy size={17}/> Tournois</Link>
        <Link to="/support" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-emerald-300"><MessageCircle size={17}/> Support</Link>
        <Link to="/about" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 font-bold text-sm text-white/70"><Info size={17}/> À propos</Link>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] border-r border-white/10 bg-black/30">
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
