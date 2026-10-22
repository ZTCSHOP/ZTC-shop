import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Check, ShieldCheck } from 'lucide-react'
import { initialProducts } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'

export default function ProductDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { products: dbProducts } = useAuth()
  const { addToCart } = useCart()
  const { t } = useLang()
  const products = dbProducts || initialProducts
  const product = products.find(p=> p.id===id)
  // Variantes normalisées (la base peut renvoyer null) + reset à chaque produit
  // (sinon l'ancien variant sélectionné n'existe pas ici => crash .price)
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const [selected, setSelected] = useState(variants[0]?.id)
  const [qty, setQty] = useState(1)
  useEffect(()=>{ setSelected(variants[0]?.id); setQty(1) }, [id])

  if(!product) return <div className="max-w-[1760px] mx-auto px-4 py-16">Produit introuvable.</div>
  const variant = variants.find(v=> v.id===selected) || variants[0]

  const handleAdd = ()=>{
    if(!variant) return
    addToCart(product, variant, qty)
    nav('/cart')
  }

  return (
    <div className="max-w-[1760px] mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
      <div className="rounded-3xl overflow-hidden bg-white/5 border border-white/10">
        <img src={product.image || `${import.meta.env.BASE_URL}favicon.svg`} alt={product.name} className="w-full h-[420px] object-cover"/>
        <div className="p-4 flex gap-2 overflow-auto">
          {variants.map(v=>(
            <div key={v.id} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs whitespace-nowrap">{v.label} • {Number(v.price||0).toFixed(2)} TND</div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs tracking-widest text-lime-400 uppercase font-bold">{product.category} • ⭐ {product.rating} • {product.stock} en stock</div>
        <h1 className="text-3xl font-black mt-1">{product.name}</h1>
        <div className="text-white/60">{product.subtitle}</div>
        <p className="text-sm text-white/70 mt-3 leading-relaxed">{product.description} Livraison instantanée après paiement. Support 24/7.</p>

        {variants.length===0 ? (
          <div className="mt-6 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">Produit momentanément indisponible.</div>
        ) : (
        <>
        <div className="mt-6">
          <div className="text-sm font-bold mb-2">{t('choose_amount')}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {variants.map(v=>(
              <button key={v.id} onClick={()=>setSelected(v.id)} className={`p-3 rounded-xl border text-left ${selected===v.id? 'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="font-bold text-sm">{v.label}</div>
                <div className={`text-sm ${selected===v.id? 'text-white':'text-lime-400'}`}>{Number(v.price||0).toFixed(2)} TND</div>
                {selected===v.id && <div className="text-[10px] mt-1 flex items-center gap-1"><Check size={12}/> {t('selected')}</div>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-2">
            <button onClick={()=>setQty(q=> Math.max(1,q-1))} className="w-8 h-8 rounded-lg bg-white/10">−</button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button onClick={()=>setQty(q=> q+1)} className="w-8 h-8 rounded-lg bg-white/10">+</button>
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs text-white/50">{t('total')}</div>
            <div className="text-xl font-black text-lime-400">{variant ? (Number(variant.price||0) * qty).toFixed(2) : '—'} TND</div>
          </div>
        </div>

        <button onClick={handleAdd} disabled={!variant} className="mt-4 w-full py-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black flex items-center justify-center gap-2 disabled:opacity-50">
          <ShoppingCart size={18}/> {t('add_cart')}
        </button>
        </>
        )}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50"><ShieldCheck size={14} className="text-emerald-400"/> Paiement sécurisé • Livraison instantanée • Code réutilisable dans l'historique</div>
      </div>
    </div>
  )
}
