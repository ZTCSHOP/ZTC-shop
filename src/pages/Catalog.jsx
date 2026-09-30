import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { categories, initialProducts, MENUS } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

export default function Catalog(){
  const [params, setParams] = useSearchParams()
  const catParam = params.get('cat') || 'all'
  const menuParam = params.get('menu') || ''
  const [q, setQ] = useState(params.get('q')||'')
  useEffect(()=>{ setQ(params.get('q')||'') }, [params])
  const [sort, setSort] = useState('popular')
  const [category, setCategory] = useState(catParam)
  const { products: dbProducts } = useAuth()
  const { lang, t } = useLang()
  const products = dbProducts || initialProducts
  const menu = MENUS.find(m=> m.id===menuParam && m.products.length>0) || null

  const filtered = useMemo(()=>{
    let arr = [...products]
    if(menu) arr = arr.filter(p=> menu.products.includes(p.id))
    else if(category!=='all') arr = arr.filter(p=> p.category===category)
    if(q) arr = arr.filter(p=> (p.name+' '+p.subtitle+' '+p.category+' '+p.variants.map(v=>v.label).join(' ')).toLowerCase().includes(q.toLowerCase()))
    if(sort==='price-asc') arr.sort((a,b)=> Math.min(...a.variants.map(v=>v.price)) - Math.min(...b.variants.map(v=>v.price)))
    if(sort==='price-desc') arr.sort((a,b)=> Math.min(...b.variants.map(v=>v.price)) - Math.min(...a.variants.map(v=>v.price)))
    if(sort==='name') arr.sort((a,b)=> a.name.localeCompare(b.name))
    return arr
  }, [products, category, q, sort, menuParam])

  const setCat = (c)=>{
    setCategory(c)
    const n = new URLSearchParams(params); if(c==='all') n.delete('cat'); else n.set('cat', c); setParams(n)
  }

  const catLabel = (id)=> id==='all' ? t('all') : (categories.find(c=>c.id===id)?.label||id)

  return (
    <div className="max-w-[1536px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-black">{menu ? (menu.label[lang]||menu.label.en) : t('catalog')}</h1>
      {menu && <span className={`inline-block mt-2 text-xs px-3 py-1.5 rounded-full border ${menu.chip||''}`}>{menu.products.length} articles</span>}
      <p className="text-white/60 text-sm mt-1">{menu ? <Link to="/catalog" className="underline">← {t('catalog')}</Link> : 'Valorant, LoL, FC 26, PUBG, Roblox, Free Fire, Netflix…'}</p>

      <div className="mt-6 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search_ph')} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-lime-500/50"/>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-white/50"/>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm">
            <option value="popular" className="bg-zinc-900">{t('sort_pop')}</option>
            <option value="price-asc" className="bg-zinc-900">{t('sort_asc')}</option>
            <option value="price-desc" className="bg-zinc-900">{t('sort_desc')}</option>
            <option value="name" className="bg-zinc-900">{t('sort_name')}</option>
          </select>
        </div>
      </div>

      {!menu && (
      <div className="mt-4 flex gap-2 overflow-auto pb-2">
        {categories.map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)} className={`cat-pill px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${category===c.id? 'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>{catLabel(c.id)}</button>
        ))}
      </div>
      )}

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p,i)=>(
          <div key={p.id} className="anim-glow reveal" style={{animationDelay:`${(i%12)*50}ms`}}>
          <Link to={`/product/${p.id}`} className="rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 hover:border-lime-400/50 transition group block">
            <div className="relative h-40 overflow-hidden">
              <img src={p.image || `${import.meta.env.BASE_URL}favicon.svg`} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
              {p.badge && <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded bg-lime-400 text-black">{p.badge}</span>}
              <span className="absolute bottom-2 right-2 text-xs bg-black/60 backdrop-blur px-2 py-1 rounded-full border border-white/10">{p.stock} {t('in_stock')}</span>
            </div>
            <div className="p-4">
              <div className="text-[11px] tracking-widest text-white/40 uppercase">{p.category}</div>
              <div className="font-bold">{p.name}</div>
              <div className="text-xs text-white/50 line-clamp-1">{p.subtitle}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.variants.slice(0,3).map(v=> <span key={v.id} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{v.label}</span>)}
                {p.variants.length>3 && <span className="text-[11px] px-2 py-1 rounded bg-lime-400/15 border border-lime-400/25 text-lime-300">+{p.variants.length-3}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-black text-lime-400">{t('from')} {Math.min(...p.variants.map(v=>v.price)).toFixed(2)} TND</span>
                <span className="text-xs px-3 py-1.5 rounded-xl bg-white text-black font-bold">{t('see')}</span>
              </div>
            </div>
          </Link>
          </div>
        ))}
      </div>
      {filtered.length===0 && <div className="text-center py-16 text-white/50">{t('no_result')}</div>}
    </div>
  )
}
