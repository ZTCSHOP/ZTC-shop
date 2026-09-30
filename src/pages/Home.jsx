import { Link } from 'react-router-dom'
import { ArrowRight, Zap, ShieldCheck, Truck, Clock } from 'lucide-react'
import { initialProducts } from '../data/products'
import { useLang } from '../context/LanguageContext'

const heroCats = [
  { id:'valorant', label:'Valorant', img:'https://images.g2a.com/300x400/1x1x1/valorant-gift-card-10-usd-riot-key-latam-i10000206410010/6a355b9399534a69b7985242' },
  { id:'lol', label:'League of Legends', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10' },
  { id:'fc26', label:'FC 26 Coins', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhPfUeZMBSqKcCZINmj7HGMN4nDmh3OVPLURigP-u5bg&s=10' },
  { id:'fc27', label:'FC 27', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhc6Hl7O2D2ZMM5mGE1Ou40bK_4_xPxWdJW8VsQ7faUHqHInv68ByFjCMH&s=10' },
  { id:'pubg', label:'PUBG UC', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2k0Xlx3K5dZvgyfn4R20bh_OFVCv93xOJkyMmx-g-Zg&s=10' },
  { id:'warzone', label:'Warzone', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZyqv8ihFLqe-huGX1idY3forMuHcN39UzhSDqVNCQ4g&s=10' },
  { id:'r6', label:'Rainbow Six', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBN2ACWqqVPyzbeCQUHPa9BmoN5rgkkccXtbNxOohIYg&s' },
  { id:'roblox', label:'Roblox', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyCcKCRn3kSwAHeU7aumRfEv7QvfvG639Rn5HkcsNUiA&s=10' },
  { id:'netflix', label:'Netflix', img:'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&q=80&auto=format&fit=crop' },
]

export default function Home(){
  const { t } = useLang()
  const trust = [
    {title: t('trust1t'), desc: t('trust1d')},
    {title: t('trust2t'), desc: t('trust2d')},
    {title: t('trust3t'), desc: t('trust3d')},
  ]
  const reviews = [
    { name: 'Neyla B.', rating: 4, text: t('rev1'), tag: 'Netflix' },
    { name: 'Mehrez T.', rating: 5, text: t('rev2'), tag: 'Valorant' },
    { name: 'Steel', rating: 5, text: t('rev3'), tag: 'FC 26' },
  ]
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(163,230,53,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(163,230,53,.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0e0a]" />
        <div className="relative max-w-[1760px] mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-8 items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-lime-400/10 border border-lime-400/30 text-xs text-lime-300 mb-4 font-bold uppercase tracking-widest">
              <Zap size={14}/> {t('home_badge')}
            </div>
            <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.85] tracking-tight uppercase">
              ZTC Shop<br/>
              <span className="text-lime-400">gift cards</span><br/>
              gaming & streaming
            </h1>
            <p className="text-white/60 mt-4 text-base max-w-lg">{t('home_sub')}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/catalog" className="px-6 py-3 rounded-lg bg-lime-400 hover:bg-lime-300 text-black font-black flex items-center gap-2 uppercase tracking-wide text-sm">{t('browse')} <ArrowRight size={18}/></Link>
              <Link to="/catalog?cat=valorant" className="px-6 py-3 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 font-bold uppercase tracking-wide text-sm">{t('view_vp')}</Link>
            </div>
            <div className="flex gap-6 mt-6 text-sm">
              <span className="flex items-center gap-2 text-white/70"><ShieldCheck size={16} className="text-lime-400"/> {t('secure')}</span>
              <span className="flex items-center gap-2 text-white/70"><Truck size={16} className="text-lime-400"/> {t('cod_short')}</span>
              <span className="flex items-center gap-2 text-white/70"><Clock size={16} className="text-lime-400"/> {t('fast')}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {heroCats.map(c=>(
              <div key={c.id} className="anim-glow">
              <Link to={`/catalog?cat=${c.id}`} className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-lime-400/60 transition block active:scale-95">
                <img src={c.img} className="w-full h-28 object-cover group-hover:scale-105 transition duration-500" alt={c.label}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                <span className="absolute bottom-2 left-2 text-xs font-bold uppercase tracking-wide">{c.label}</span>
              </Link>
              </div>
            ))}
            <div className="col-span-3 rounded-xl bg-lime-400 text-black p-4 flex items-center justify-between">
              <div><div className="font-display text-2xl font-bold uppercase leading-none">+ 10 marques</div><div className="text-xs font-semibold opacity-70">PSN, Xbox, Steam…</div></div>
              <Link to="/catalog" className="w-9 h-9 rounded-lg bg-black text-lime-400 flex items-center justify-center"><ArrowRight size={18}/></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Affiche FC27 PC Steam */}
      <section className="max-w-[1760px] mx-auto px-4 -mt-2 mb-2">
        <div className="reveal rounded-3xl overflow-hidden border border-lime-500/30 bg-gradient-to-r from-lime-900/40 via-[#141417] to-[#141417] grid md:grid-cols-[220px_1fr] items-stretch">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhc6Hl7O2D2ZMM5mGE1Ou40bK_4_xPxWdJW8VsQ7faUHqHInv68ByFjCMH&s=10" alt="EA FC 27 PC" className="w-full h-44 md:h-full object-cover"/>
          <div className="p-5 md:p-6 flex flex-col justify-center gap-2">
            <span className="w-fit text-[11px] font-black px-2.5 py-1 rounded-full bg-lime-500 text-black">{t('promo27_badge')}</span>
            <h2 className="text-2xl md:text-3xl font-black">{t('promo27_title')}</h2>
            <p className="text-sm text-white/60">{t('promo27_sub')}</p>
            <div className="flex flex-wrap gap-2.5 mt-2">
              <Link to="/product/fc27-pc" className="px-5 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-black text-sm">{t('promo27_std')} • 130 TND</Link>
              <Link to="/product/fc27-pc" className="px-5 py-3 rounded-xl bg-white text-black hover:bg-white/85 font-black text-sm">{t('promo27_ult')} • 240 TND</Link>
            </div>
          </div>
        </div>
      </section>
      {/* Bande marques */}
      <div className="overflow-hidden border-y border-white/10 bg-black/40 py-3 select-none" dir="ltr">
        <div className="max-w-[1760px] mx-auto px-4 flex gap-8 items-center overflow-x-auto text-xs font-black tracking-widest text-white/50 whitespace-nowrap">
          {['VALORANT','LEAGUE OF LEGENDS','FC 27','PUBG','WARZONE','RAINBOW SIX','ROBLOX','STEAM','NETFLIX'].map((s,i)=>(
            <span key={i} className="flex items-center gap-8 whitespace-nowrap">{s}<span className="text-lime-500">/</span></span>
          ))}
        </div>
      </div>

      <section className="max-w-[1760px] mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 reveal">
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide">{t('popular')}</h2>
          <Link to="/catalog" className="text-sm text-lime-400 hover:text-lime-300 font-bold">{t('see_all')}</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {initialProducts.slice(0,8).map((p,i)=>(
            <div key={p.id} className="anim-glow reveal" style={{animationDelay:`${(i%8)*70}ms`}}>
            <Link to={`/product/${p.id}`} className="rounded-xl overflow-hidden bg-[#101310] border border-white/10 hover:border-lime-400/60 transition group block">
              <div className="relative h-36 overflow-hidden">
                <img src={p.image || `${import.meta.env.BASE_URL}favicon.svg`} className="w-full h-full object-cover group-hover:scale-105 transition" alt={p.name}/>
                {p.badge && <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded bg-lime-400 text-black">{p.badge}</span>}
                <span className="absolute top-2 right-2 text-[11px] bg-black/60 backdrop-blur px-2 py-1 rounded-full">⭐ {p.rating}</span>
              </div>
              <div className="p-4">
                <div className="text-[11px] text-lime-500/80 uppercase tracking-widest font-bold">{p.category}</div>
                <div className="font-bold leading-tight">{p.name}</div>
                <div className="text-xs text-white/50">{p.subtitle}</div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-sm text-white/50">{t('from')}</span>
                  <span className="font-display text-2xl font-bold text-lime-400">{Math.min(...p.variants.map(v=>v.price)).toFixed(2)} TND</span>
                </div>
              </div>
            </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Avis clients */}
      <section className="max-w-[1760px] mx-auto px-4 pb-4">
        <div className="text-center mb-6 reveal">
          <h2 className="text-2xl font-black">{t('reviews_t')}</h2>
          <p className="text-sm text-white/50 mt-1">{t('reviews_sub')} • <span className="text-amber-400 font-black">★ 4.7/5</span></p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((r,i)=>(
            <div key={r.name} className="reveal rounded-2xl p-5 bg-white/[0.04] border border-white/10" style={{animationDelay:`${i*80}ms`}}>
              <div className="text-lg tracking-wider">
                {[1,2,3,4,5].map(s=> <span key={s} className={s<=r.rating?'text-amber-400':'text-white/20'}>★</span>)}
                <span className="text-xs text-white/50 ml-2">{r.rating}/5</span>
              </div>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">“{r.text}”</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 text-black flex items-center justify-center font-black text-sm">{r.name[0]}</div>
                  <span className="font-bold text-sm">{r.name}</span>
                </div>
                <span className="text-[11px] px-2 py-1 rounded bg-lime-400/15 border border-lime-400/25 text-lime-300">{r.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1760px] mx-auto px-4 pb-12 grid md:grid-cols-3 gap-4">
        {trust.map(f=>(
          <div key={f.title} className="rounded-2xl p-5 bg-white/[0.04] border border-white/10">
            <div className="font-bold">{f.title}</div>
            <div className="text-sm text-white/60 mt-1">{f.desc}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
