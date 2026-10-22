import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Crown, Check, Shield, Coins, Copy, Plus, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { D17_NUMBER } from './Checkout'
import { xpForActivity, levelProgress } from '../lib/level'
import { uploadImage } from '../lib/storage'
import XpRewards from '../components/XpRewards'
import RiotCard from '../components/RiotCard'

function useHashScroll(){
  const { hash } = useLocation()
  useEffect(()=>{
    if(!hash) return
    const t = setTimeout(()=>{ document.getElementById(hash.slice(1))?.scrollIntoView({ behavior:'smooth', block:'start' }) }, 250)
    return ()=> clearTimeout(t)
  }, [hash])
}

function MyTournaments(){
  const { myRegs, tournaments } = useAuth()
  const { t } = useLang()
  const regs = myRegs()
  return (
    <div id="mytournaments" className="mt-6 rounded-3xl bg-white/[0.04] border border-white/10 p-5 scroll-mt-24">
      <h2 className="font-black flex items-center gap-2"><Trophy size={17} className="text-amber-400"/> {t('pm_mytournaments')||'Mes Tournois'} ({regs.length})</h2>
      {regs.length===0
        ? <div className="text-xs text-white/50 mt-2">{t('team_my_empty')} <Link to="/tournaments" className="text-amber-300 font-bold">→ {t('tournaments')}</Link></div>
        : <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {regs.map(r=>{
              const tr = tournaments.find(x=>x.id===r.tournament_id)
              return (
                <Link key={r.id} to={tr ? `/tournaments/${tr.id}` : '/tournaments'} className="rounded-2xl bg-black/30 border border-white/10 p-3 hover:border-amber-500/50">
                  <div className="font-bold text-sm truncate">{tr?.title || r.tournament_id}</div>
                  <div className="text-[11px] text-white/50 mt-0.5">🛡️ {r.team} • {tr?.status||''} {tr?.prize?`• 🏆 ${tr.prize}`:''}</div>
                </Link>
              )
            })}
          </div>}
    </div>
  )
}

function ProfileSettings(){
  const { user, updateProfile, myOrders, myRegs, myTeams } = useAuth()
  const { t } = useLang()
  const [name, setName] = useState(user.name||'')
  const [phone, setPhone] = useState(user.phone||myOrders()[0]?.customer?.phone||'')
  const [birthdate, setBirthdate] = useState(user.birthdate||'')
  const [gender, setGender] = useState(user.gender||'')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const xp = xpForActivity({ orders: myOrders().length, regs: myRegs().length, teams: myTeams().length })
  const { level, cur, need } = levelProgress(xp)
  const saveMsg = (e)=> {
    console.error('Profile update error:', e)
    setMsg(e?.message==='quota' ? (t('pm_quota')||'Image trop lourde — choisis une image plus petite') : (e?.message || t('teams_join_err')))
  }
  const imgToData = (f, maxW, maxH, cb)=>{
    if(!f || !f.type.startsWith('image/')){ setMsg(t('team_logo_bad')); return }
    if(f.size > 5*1024*1024){ setMsg(t('team_logo_big')); return }
    const rd = new FileReader()
    rd.onload = ()=>{
      const img = new Image()
      img.onload = ()=>{
        const s = Math.min(1, maxW / img.width, maxH / img.height)
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width*s)); c.height = Math.max(1, Math.round(img.height*s))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        cb(c.toDataURL('image/jpeg', 0.82))
      }
      img.src = rd.result
    }
    rd.readAsDataURL(f)
  }
  const save = async (e)=>{
    e.preventDefault(); setMsg(''); setBusy(true)
    try{ await updateProfile({ name, phone, birthdate, gender }); setMsg('✓ ' + (t('pm_saved')||'Enregistré')) }catch(e){ saveMsg(e) }
    finally{ setBusy(false) }
  }
  const btnUp = 'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm font-bold hover:bg-white/10 cursor-pointer'
  const btnRm = 'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-transparent border border-red-500/60 text-red-400 text-sm font-bold hover:bg-red-500/10'
  return (
    <div id="settings" className="mt-6 rounded-3xl bg-[#16181d] border border-white/10 p-6 scroll-mt-24">
      <h2 className="text-xl font-black flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">⚙️</span> {t('pm_settings_title')||'Paramètres du profil'}</h2>
      <p className="text-xs text-white/50 mt-0.5">{t('pm_settings_sub')||"Mettez à jour vos photos et vos informations personnelles"}</p>
      <div className="mt-5 grid md:grid-cols-[220px_1fr] gap-6">
        <div>
          <div className="text-sm font-black mb-2">{t('pm_avatar')||'Photo de profil'}</div>
          <div className="w-[180px] h-[180px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {user.avatar
              ? <img src={user.avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover"/>
              : <span className="text-5xl font-black text-white/20">{(user.name||user.email||'?')[0].toUpperCase()}</span>}
          </div>
          <div className="mt-3 flex gap-2 w-[180px]">
            <label className={btnUp}>⬆ <span className="text-xs">Upload</span><input type="file" accept="image/*" className="hidden" onChange={async e=>{ const f=e.target.files?.[0]; e.target.value=''; imgToData(f, 400, 400, async (d)=>{ try{ const url = await uploadImage(d, 'avatars'); await updateProfile({ avatar: url }); setMsg('✓') }catch(e){ saveMsg(e) } }) }}/></label>
            <button onClick={async()=>{ await updateProfile({ avatar: '' }); setMsg('✓') }} className={btnRm}>🗑 <span className="text-xs">Remove</span></button>
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">Recommended: 400x400px</div>
        </div>
        <div>
          <div className="text-sm font-black mb-2">{t('pm_banner')||'Arrière-plan du profil'}</div>
          <div className="h-[180px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {user.banner
              ? <img src={user.banner} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover"/>
              : <span className="text-white/20 text-sm">1600 x 500</span>}
          </div>
          <div className="mt-3 flex gap-2 max-w-[420px]">
            <label className={btnUp}>⬆ <span className="text-xs">Upload</span><input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; e.target.value=''; imgToData(f, 1280, 400, async (d)=>{ try{ const url = await uploadImage(d, 'banners'); await updateProfile({ banner: url }); setMsg('✓') }catch(e){ saveMsg(e) } }) }}/></label>
            <button onClick={async()=>{ await updateProfile({ banner: '' }); setMsg('✓') }} className={btnRm}>🗑 <span className="text-xs">Remove</span></button>
          </div>
          <div className="text-[11px] text-white/40 mt-1.5">Recommended: 1600x500px</div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs"><span className="font-black">Niveau {level}</span><span className="text-white/50">{cur} / {need} XP</span></div>
        <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-royal-500 to-lime-400" style={{ width: `${Math.min(100, Math.round((cur/need)*100))}%` }}/>
        </div>
      </div>
      <form onSubmit={save} className="mt-5 grid sm:grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-white/60 mb-1">{t('pm_username')||"Nom d'utilisateur"}</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name_ph')} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/></div>
        <div><label className="block text-xs font-bold text-white/60 mb-1">{t('pm_phone')||'Numéro de téléphone'}</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t('phone_ph')} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/></div>
        <div><label className="block text-xs font-bold text-white/60 mb-1">{t('pm_birth')||'Date de naissance'}</label>
        <input type="date" value={birthdate} onChange={e=>setBirthdate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500 [color-scheme:dark]"/></div>
        <div><label className="block text-xs font-bold text-white/60 mb-1">{t('pm_gender')||'Sexe'}</label>
        <select value={gender} onChange={e=>setGender(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500">
          <option value="">—</option><option value="male">{t('pm_male')||'Homme'}</option><option value="female">{t('pm_female')||'Femme'}</option>
        </select></div>
        <div className="text-xs text-white/50 px-1 self-center truncate">{user.email||''}</div>
        <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black disabled:opacity-60">{busy ? '...' : (t('pm_save')||'Enregistrer')}</button>
      </form>
      {msg && <div className="mt-2 text-xs text-emerald-300">{msg}</div>}
    </div>
  )
}

function VipCard(){
  const { user, isVipActive, myVipSub, createVipSub, VIP_PRICE, VIP_DISCOUNT } = useAuth()
  const { t } = useLang()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const active = isVipActive()
  const sub = myVipSub()
  const ask = async ()=>{
    setMsg(''); setBusy(true)
    try{ await createVipSub(); setMsg(t('vip_req_ok')) }
    catch(e){ setMsg(e.message==='exists' ? t('vip_req_exists') : e.message==='need_sql' ? t('vip_need_sql') : t('teams_join_err')) }
    finally{ setBusy(false) }
  }
  return (
    <div className={`mt-6 rounded-3xl border p-5 ${active ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-amber-500/40' : 'bg-white/[0.04] border-white/10'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black' : 'bg-white/5 border border-white/10 text-amber-300'}`}>
          <Crown size={22}/>
        </span>
        <div className="flex-1">
          <div className="font-black flex items-center gap-2">ZTC VIP {active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black">✓ {t('vip_badge')}</span>}</div>
          <div className="text-xs text-white/60 mt-0.5">
            {active
              ? `${t('vip_active_until')} ${user.vipUntil ? new Date(user.vipUntil).toLocaleDateString() : ''} • -${Math.round(VIP_DISCOUNT*100)}% ${t('vip_on_shop')}`
              : `${VIP_PRICE.toFixed(2)} TND/${t('vip_month')} • -${Math.round(VIP_DISCOUNT*100)}% ${t('vip_on_shop')} • ${t('vip_priority')}`}
          </div>
        </div>
      </div>
      {!active && (
        sub?.status==='pending'
          ? <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2"><Check size={14}/> {t('vip_req_pending')}</div>
          : <button onClick={ask} disabled={busy} className="mt-3 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-black disabled:opacity-60">
              {busy ? '...' : `${t('vip_become')} — ${VIP_PRICE.toFixed(2)} TND`}
            </button>
      )}
      {msg && <div className="mt-2 text-xs text-emerald-300">{msg}</div>}
    </div>
  )
}

function MyTeam(){
  const { user, teams } = useAuth()
  const { t } = useLang()
  const mine = teams.filter(x=> x.userId===user.id)
  return (
    <div id="myteam" className="mt-6 rounded-3xl bg-white/[0.04] border border-white/10 p-5 scroll-mt-24">
      <h2 className="font-black flex items-center gap-2"><Shield size={17} className="text-emerald-400"/> {t('team_my')}</h2>
      {mine.length===0
        ? <div className="text-xs text-white/50 mt-2">{t('team_my_empty')} <Link to="/teams" className="text-emerald-300 font-bold">→ {t('teams')}</Link></div>
        : <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {mine.map(x=>(
              <Link key={'t-'+x.id} to={`/teams/${encodeURIComponent(x.name)}`} className="flex items-center gap-2.5 rounded-2xl bg-black/30 border border-white/10 p-3 hover:border-emerald-500/50">
                {x.logo ? <img src={x.logo} alt="" loading="lazy" decoding="async" className="w-9 h-9 rounded-xl object-cover bg-white"/> : <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">🛡️</span>}
                <div className="min-w-0"><div className="font-bold text-sm truncate">{x.name}</div><div className="text-[11px] text-white/50">🎮 {x.game} • {t('tc_new')}</div></div>
              </Link>
            ))}
          </div>}
    </div>
  )
}

function Wallet(){
  const { user, myRecharges, createRecharge, COIN_RATE } = useAuth()
  const { t } = useLang()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const list = myRecharges()
  const copyNum = async ()=>{ try{ await navigator.clipboard.writeText(D17_NUMBER); setCopied(true); setTimeout(()=>setCopied(false), 2000) }catch{} }
  const submit = async (e)=>{
    e.preventDefault(); setMsg(''); setBusy(true)
    try{
      await createRecharge({ amountTnd: amount, phone })
      setAmount(''); setMsg(t('wal_req_ok'))
    }catch(err){ setMsg(err.message==='amount' ? t('wal_bad_amount') : err.message==='need_sql' ? t('wal_need_sql') : t('teams_join_err')) }
    finally{ setBusy(false) }
  }
  return (
    <div id="wallet" className="mt-6 rounded-3xl bg-gradient-to-br from-amber-500/15 to-yellow-600/5 border border-amber-500/30 p-5 scroll-mt-24">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center"><Coins size={22}/></span>
        <div className="flex-1">
          <div className="font-black">{t('wal_title')}</div>
          <div className="text-2xl font-black text-amber-300">{Number(user.balance||0).toFixed(0)} <span className="text-sm">🪙</span></div>
        </div>
      </div>
      <div className="mt-3 text-xs text-white/60 leading-relaxed">
        1 DT = 1 🪙 • {t('wal_step1')} <b className="text-emerald-300 text-base tracking-widest">{D17_NUMBER}</b>
        <button onClick={copyNum} className="ml-2 px-2 py-1 rounded-lg bg-white/10 text-[11px] font-bold">{copied ? '✓' : t('d17copy')}</button>
        <br/>2️⃣ {t('wal_step2')} 3️⃣ {t('wal_step3')}
      </div>
      <form onSubmit={submit} className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="1" placeholder={t('wal_amount_ph')} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-amber-500"/>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t('phone_ph')} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-amber-500"/>
        <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-black disabled:opacity-60 flex items-center gap-1.5"><Plus size={15}/> {t('wal_submit')}</button>
      </form>
      {msg && <div className="mt-2 text-xs text-emerald-300">{msg}</div>}
      {list.length>0 && (
        <div className="mt-3 space-y-1.5">
          {list.slice(0,5).map(r=>(
            <div key={r.id} className="text-xs flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="font-bold">+{r.coins} 🪙</span>
              <span className="text-white/50">{r.amount} TND • D17</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full font-bold ${r.status==='approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Orders(){
  const { user, myOrders, retryOrder, refreshMyBalance } = useAuth()
  const { t } = useLang()
  const [retrying, setRetrying] = useState(null)
  const [retryMsg, setRetryMsg] = useState('')
  useEffect(()=>{ try{ refreshMyBalance() }catch{} }, [])
  useHashScroll()
  if(!user) return <div className="max-w-[800px] mx-auto px-4 py-16 text-center">{t('login_required')}<br/><Link to="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('login')}</Link></div>
  const list = myOrders()
  const badge = (s)=>{
    if(s.includes('Annulée')) return 'bg-red-500/20 text-red-300 border-red-500/30'
    if(s.includes('Livrée')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if(s.includes('Confirmée')||s.includes('Payée')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }
  if(list.length===0) return (
    <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
      <Link to="/profile" className="inline-block mb-3 text-xs font-bold text-white/50 hover:text-lime-300">← {t('dash_title')||'Mon Espace Membre'}</Link>
      <h2 className="text-xl font-black">{t('no_orders')}</h2>
      <p className="text-white/60 text-sm mt-1">{t('no_orders_d')}</p>
      <Link to="/catalog" className="inline-block mt-4 px-6 py-3 rounded-xl bg-lime-400 text-black font-black">{t('go_catalog')}</Link>
      <div className="text-left mt-6"><VipCard /></div>
      <div className="text-left"><XpRewards /></div>
      <div className="text-left"><RiotCard /></div>
      <div className="text-left"><MyTournaments /></div>
      <div className="text-left"><MyTeam /></div>
      <div className="text-left"><Wallet /></div>
      <div className="text-left"><ProfileSettings /></div>
    </div>
  )
  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-lime-300 mb-2">← {t('dash_title')||'Mon Espace Membre'}</Link>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide">{t('profile')}</h1>
      <p className="text-sm text-white/50">{user.provider}{user.email? ` • ${user.email}`: user.principal? ` • ${user.principal}`:''}</p>
      <VipCard />
      <XpRewards />
      <RiotCard />
      <MyTournaments />
      <MyTeam />
      <Wallet />
      <ProfileSettings />
      <h2 id="orders" className="text-lg font-black mt-6 scroll-mt-24">{t('my_orders')}</h2>
      {!user.cloud && <p className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">⚠️ Compte local : tes commandes restent sur cet appareil. Crée un compte email pour les retrouver partout et que le support les voie.</p>}
      {retryMsg && <p className="mt-2 text-xs text-white/70">{retryMsg}</p>}
      <div className="mt-6 space-y-3">
        {list.map(o=>(
          <div key={o.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-lime-400/40">
            <Link to={`/orders/${o.id}`} className="block">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="font-bold">{o.id} • {new Date(o.date).toLocaleString()}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold border ${badge(o.status)}`}>{o.status}</span>
              </div>
              <div className="text-sm text-white/60 mt-1">{o.items.length} article(s) • {o.total.toFixed(2)} TND • {o.method==='card'?'Carte':o.method==='d17'?'D17':o.method==='wallet'?'Wallet 🪙':'À la livraison'}{o.customer?.phone? ` • 📞 ${o.customer.phone}`:''}</div>
            </Link>
            {o.syncError && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full font-bold border bg-red-500/20 text-red-300 border-red-500/30">⚠️ Non envoyée au support</span>
                <button disabled={retrying===o.id} onClick={async()=>{ setRetrying(o.id); setRetryMsg(''); const ok = await retryOrder(o.id); setRetrying(null); setRetryMsg(ok ? '✓ Envoyée !' : '✗ Échec — vérifie ta connexion puis réessaie.') }} className="px-3 py-1.5 rounded-xl bg-lime-400 text-black font-black disabled:opacity-60">↻ Renvoyer</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
