import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Smartphone, Copy, Check, Lock } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

function genCode(){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<16;i++) s+=chars[Math.floor(Math.random()*chars.length)]; return s.match(/.{1,4}/g).join('-') }

export const D17_NUMBER = '20074821'

export default function Checkout(){
  const { cart, total: rawTotal, clearCart } = useCart()
  const { user, addOrder, isVipActive, VIP_DISCOUNT } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const vip = isVipActive()
  const total = vip ? Math.round(rawTotal * (1 - VIP_DISCOUNT) * 100) / 100 : rawTotal
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'' })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if(cart.length===0) return <div className="max-w-[600px] mx-auto px-4 py-16 text-center">Panier vide.</div>
  if(!user) return (
    <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
      <Lock className="mx-auto text-lime-400" size={32}/>
      <h2 className="text-xl font-black mt-3">{t('login_required')}</h2>
      <p className="text-white/60 text-sm mt-1">{t('login_required_d')}</p>
      <button onClick={()=>nav('/login')} className="mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</button>
    </div>
  )

  const copyNum = async ()=>{
    try{ await navigator.clipboard.writeText(D17_NUMBER); setCopied(true); setTimeout(()=>setCopied(false), 2000) }catch{}
  }

  const handlePay = async (e)=>{
    e.preventDefault()
    if(!form.email || !form.name) return alert('Nom et email requis')
    const phoneClean = (form.phone||'').replace(/[\s.-]/g,'')
    if(!phoneClean) return alert('Numéro de téléphone requis pour te contacter (livraison)')
    if(!/^[0-9+]{8,15}$/.test(phoneClean)) return alert('Numéro de téléphone invalide (8-15 chiffres, ex: 98 123 456)')
    setLoading(true)
    await new Promise(r=> setTimeout(r, 900))
    const order = {
      id: 'ORD-'+Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      items: cart.map(c=> ({...c, code: genCode()})),
      total, method: 'd17', vip, customer: { name: form.name, email: form.email, phone: (form.phone||'').replace(/[\s.-]/g,''), address: form.address },
      userId: user.id, principal: user.principal, provider: user.provider,
      // Tout code reste verrouillé jusqu'à confirmation admin après réception D17
      status: 'En attente de confirmation (paiement reçu)'
    }
    addOrder(order)
    clearCart()
    nav(`/orders/${order.id}`)
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 grid lg:grid-cols-[1fr_380px] gap-6">
      <form onSubmit={handlePay} className="space-y-6">
        <h1 className="text-2xl font-black">{t('payment')}</h1>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h3 className="font-bold mb-3">{t('info')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder={t('name_ph')} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-lime-500"/>
            <input placeholder={t('email_ph')} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-lime-500"/>
            <input placeholder="Téléphone (ex: 98 123 456) *" inputMode="tel" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-lime-500"/>
            <input placeholder={t('addr_ph')} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-lime-500"/>
          </div>
          <p className="text-[11px] text-white/40 mt-2">* Requis — on t’appelle sur ce numéro en cas de livraison / paiement à la livraison.</p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Smartphone size={18} className="text-emerald-400"/> {t('d17t')}</h3>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqjUIA-tQu6Cns_hL30KEbbam8v8Fn32EmahoDQDE35Q&s=10" alt="D17" className="mx-auto h-14 w-14 rounded-2xl object-cover"/>
            <div className="text-xs text-white/60 mt-2">{t('d17s1')}</div>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-3xl font-black tracking-widest text-emerald-300">{D17_NUMBER}</span>
              <button type="button" onClick={copyNum} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold flex items-center gap-1">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? t('d17copied') : t('d17copy')}</button>
            </div>
            <div className="text-lg font-black mt-2">{t('pay')} {total.toFixed(2)} TND</div>
          </div>
          <ul className="text-sm text-white/70 mt-3 space-y-1.5">
            <li>{t('d17s2')} 📸</li>
            <li>{t('d17s3')} 💬 <Link to="/support" className="text-emerald-300 underline font-bold">Support</Link></li>
          </ul>
        </div>

        <button disabled={loading} className="w-full py-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black disabled:opacity-60">
          {loading? '...' : `${t('d17paybtn')} • ${total.toFixed(2)} TND`}
        </button>
      </form>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 h-fit sticky top-20">
        <h3 className="font-black">{t('order')}</h3>
        <div className="mt-3 space-y-2">
          {cart.map(i=> <div key={i.key} className="flex justify-between text-sm"><span className="text-white/70">{i.name} ×{i.qty} <span className="text-white/40">({i.variantLabel})</span></span><span className="font-semibold">{(i.price*i.qty).toFixed(2)} TND</span></div>)}
          <div className="flex justify-between font-black border-t border-white/10 pt-2"><span>{t('total')}</span><span className="text-lime-400">{total.toFixed(2)} TND</span></div>
          {vip && <div className="flex justify-between text-xs font-bold text-amber-300 pt-1"><span>👑 VIP -{Math.round(VIP_DISCOUNT*100)}%</span><span>-{(rawTotal - total).toFixed(2)} TND</span></div>}
        </div>
        <div className="mt-4 text-xs text-white/40">En confirmant, tes codes seront générés et visibles dans “Mes commandes”.</div>
      </div>
    </div>
  )
}
