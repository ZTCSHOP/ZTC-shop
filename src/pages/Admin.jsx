import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { initialProducts, categories } from '../data/products'
import { Plus, Trash2, Phone, Check, Truck, X, Users, Search, RefreshCw, MessageCircle, Send, Trophy, Volume2, VolumeX } from 'lucide-react'
import TournamentManager from '../components/TournamentManager'
import { useIncomingSound, useSoundToggle } from '../lib/sound'

export default function Admin(){
  const { user, orders, updateOrderStatus, deleteOrder, deleteAccount, products, setProducts, saveProducts, allAccounts, cloud, needsDbGrant, refreshAll, adminThreads, sendMessage, markThreadRead, messages, tournaments, saveTournament, deleteTournament, regsFor, deleteReg } = useAuth()
  const [trnForm, setTrnForm] = useState({ title:'', game:'valorant', date:'', prize:'', max_teams:16, entry_fee:0, status:'soon', rules:'', image:'' })
  const imgForGame = (g)=> initialProducts.find(p=>p.category===g)?.image || ''
  const handleCreateTrn = async ()=>{
    if(!trnForm.title) return alert('Titre requis')
    try{
      await saveTournament({ ...trnForm, max_teams: Number(trnForm.max_teams)||16, entry_fee: Number(trnForm.entry_fee)||0, image: trnForm.image || imgForGame(trnForm.game) })
      setTrnForm({ title:'', game:'valorant', date:'', prize:'', max_teams:16, entry_fee:0, status:'soon', rules:'', image:'' })
    }catch{ alert('Écriture cloud refusée — vérifie ton droit admin (SQL is_admin)') }
  }
  const handleDeleteTrn = async (id)=>{
    if(!window.confirm(t('tr_delete_q'))) return
    try{ await deleteTournament(id) }catch{ alert(t('del_need_policy')) }
  }
  const threads = adminThreads()
  const totalUnread = threads.reduce((s,th)=> s+th.unread, 0)
  const [soundOn, toggleSound] = useSoundToggle()
  useIncomingSound(messages, 'client')
  const [activeThread, setActiveThread] = useState(null)
  const [reply, setReply] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const currentThread = threads.find(th=> th.userId===activeThread)
  const threadMessages = messages.filter(m=> m.userId===activeThread).sort((a,b)=> new Date(a.date||0)-new Date(b.date||0))
  const openThread = (id)=>{ setActiveThread(id); setReply(''); markThreadRead(id) }
  const handleReply = async (e)=>{
    e.preventDefault()
    if(!reply.trim()) return
    await sendMessage({ text: reply, toUserId: activeThread })
    setReply('')
  }

  const handleDeleteOrder = async (id)=>{
    if(!window.confirm(t('del_order_q'))) return
    try{ await deleteOrder(id) }catch{ alert(t('del_need_policy')) }
  }
  const handleDeleteAccount = async (a)=>{
    if(a.id===user.id || a.isAdmin) return alert('Impossible : compte admin/propriétaire.')
    if(!window.confirm(`${t('del_account_q')}\n${a.name||''} ${a.email||''}`)) return
    try{ await deleteAccount(a.id) }catch{ alert(t('del_need_policy')) }
  }
  const { t } = useLang()
  const prods = products || initialProducts
  const [tab, setTab] = useState('orders')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [newProd, setNewProd] = useState({ name:'', category:'valorant', price:'', label:'' })
  const [qUser, setQUser] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const visibleProds = catFilter==='all' ? prods : prods.filter(p=>p.category===catFilter)

  // Actualisation auto des commandes clients toutes les 15s + bouton manuel
  const doRefresh = async ()=>{
    setSpinning(true)
    try{ await refreshAll() }finally{
      setLastSync(new Date())
      setTimeout(()=>setSpinning(false), 600)
    }
  }
  useEffect(()=>{
    if(tab!=='orders') return
    doRefresh()
    const timer = setInterval(doRefresh, 15000)
    return ()=> clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])
  const accounts = allAccounts()
  const visibleAccounts = qUser
    ? accounts.filter(a=> ((a.name||'')+' '+(a.email||'')+' '+(a.phones||[]).join(' ')+' '+(a.provider||'')).toLowerCase().includes(qUser.toLowerCase()))
    : accounts

  if(!user?.isAdmin) return (
    <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-black">Accès administrateur requis</h2>
      <p className="text-white/60 text-sm mt-1">Connecte-toi avec le bouton “Connexion Admin” sur la page Login.</p>
    </div>
  )

  const initIfNeeded = async ()=> { if(!products){ try{ await saveProducts(initialProducts) }catch{ setProducts(initialProducts) } } }

  const persist = async (next)=>{
    try{ await saveProducts(next) }
    catch{ alert('Écriture cloud refusée — vérifie ton droit admin (SQL is_admin)'); setProducts(next) }
  }

  const handleAddVariant = ()=>{
    if(!newProd.name || !newProd.price) return alert('Nom et prix requis')
    const p = {
      id: 'custom-'+Date.now(), category: newProd.category, name: newProd.name, subtitle:'Ajouté via admin',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', badge:'NEW',
      description:'Produit créé depuis la console admin.', variants:[{id:'var-'+Date.now(), label:newProd.label||newProd.price+' TND', price: parseFloat(newProd.price)}],
      stock: 50, rating: 5.0
    }
    persist([p, ...prods]); setNewProd({ name:'', category:'valorant', price:'', label:'' })
  }

  const changeStock = (id, delta)=>{
    persist(prods.map(p=> p.id===id? {...p, stock: Math.max(0, p.stock+delta)}:p))
  }
  const deleteProd = (id)=> persist(prods.filter(p=> p.id!==id))

  const isPending = (o)=> o.status.includes('En attente') || o.status.toLowerCase().includes('attente')
  const pendingCount = orders.filter(isPending).length
  const filtered = orders.filter(o=>{
    if(filter==='pending') return isPending(o)
    if(filter==='confirmed') return o.status.includes('Confirmée') || o.status.includes('Payée')
    if(filter==='delivered') return o.status.includes('Livrée')
    if(filter==='cancelled') return o.status.includes('Annulée')
    return true
  })

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-black">{t('admin')} {cloud && <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 align-middle">☁️ Cloud partagé</span>}</h1>
      <p className="text-sm text-white/50">Chaque commande client arrive ici — confirme-la, appelle le client au besoin.</p>
      {needsDbGrant && (
        <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm">
          <div className="font-black text-amber-300">⚠️ Dernière étape pour voir les commandes de TOUS les clients :</div>
          <div className="text-white/70 mt-1">Dans Supabase &gt; SQL Editor, exécute ces 2 blocs :</div>
          <code className="block mt-2 p-2.5 rounded-xl bg-black/50 font-mono text-xs text-emerald-300 whitespace-pre-wrap">{"-- 1) autorise le réglage admin via SQL Editor\ncreate or replace function public.prevent_admin_escalation() returns trigger language plpgsql security definer set search_path = public as $$ begin if NEW.is_admin is distinct from OLD.is_admin and not public.is_admin() and current_user not in ('postgres','service_role') then raise exception 'Seul un admin peut modifier le rôle admin.'; end if; return NEW; end; $$;\n\n-- 2) nomme le propriétaire admin\nupdate public.profiles set is_admin = true where email = 'apatchegaming@gmail.com';"}</code>
          <button onClick={refreshAll} className="mt-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">↻ Revérifier</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={()=>setTab('orders')} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tab==='orders'?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10'}`}>
          {t('orders_tab')} ({orders.length}){pendingCount>0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-xs">{pendingCount} à confirmer</span>}
        </button>
        <button onClick={()=>setTab('products')} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tab==='products'?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10'}`}>{t('products_stock')}</button>
        <button onClick={()=>setTab('users')} className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-1.5 ${tab==='users'?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10'}`}><Users size={15}/> Comptes ({accounts.length})</button>
        <button onClick={()=>setTab('messages')} className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-1.5 ${tab==='messages'?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10'}`}><MessageCircle size={15}/> {t('messages_tab')} {totalUnread>0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs animate-pulse">{totalUnread}</span>}</button>
        <button onClick={toggleSound} title={soundOn ? t('sound_on') : t('sound_off')} className="px-3 py-2 rounded-xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">{soundOn ? <Volume2 size={15}/> : <VolumeX size={15}/>}</button>
        <button onClick={()=>setTab('tournaments')} className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-1.5 ${tab==='tournaments'?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10'}`}><Trophy size={15}/> {t('tournaments')} ({tournaments.length})</button>
        <button onClick={initIfNeeded} className="ml-auto text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10">Réinitialiser DB démo</button>
      </div>

      {tab==='products' && (
        <div className="mt-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 grid md:grid-cols-5 gap-3">
            <input placeholder="Nom produit" value={newProd.name} onChange={e=>setNewProd({...newProd,name:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <select value={newProd.category} onChange={e=>setNewProd({...newProd,category:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
              <option value="valorant">Valorant</option><option value="lol">LoL</option><option value="battlenet">Battle.net</option><option value="steamfresh">Steam Fresh</option><option value="steam-games">Steam Games</option><option value="battlenet-games">BNet Games</option><option value="xbox-games">Xbox Games</option><option value="ps5-games">PS5 Games</option><option value="fc26">FC26</option><option value="fc27">FC27</option><option value="pubg">PUBG</option><option value="warzone">Warzone</option><option value="r6">Rainbow Six</option><option value="roblox">Roblox</option><option value="freefire">Free Fire</option><option value="netflix">Netflix</option><option value="other">Autres</option>
            </select>
            <input placeholder="Label (ex 1000 VP)" value={newProd.label} onChange={e=>setNewProd({...newProd,label:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder="Prix TND" type="number" value={newProd.price} onChange={e=>setNewProd({...newProd,price:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <button onClick={handleAddVariant} className="px-4 py-2.5 rounded-xl bg-lime-400 text-black font-black flex items-center justify-center gap-2"><Plus size={16}/> Ajouter</button>
          </div>

          {/* Mêmes catégories que les clients */}
          <div className="mt-4 flex gap-2 overflow-auto pb-2">
            {categories.map(c=>(
              <button key={c.id} onClick={()=>setCatFilter(c.id)} className={`cat-pill px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${catFilter===c.id?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10 text-white/70'}`}>{c.id==='all'?t('all'):c.label} ({c.id==='all'?prods.length:prods.filter(p=>p.category===c.id).length})</button>
            ))}
          </div>

          {/* Mêmes visuels que les clients (photo, catégorie, montants) + gestion stock */}
          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProds.map(p=>(
              <div key={p.id} className="rounded-2xl overflow-hidden bg-[#18181b] border border-white/10">
                <div className="relative h-40 overflow-hidden">
                  <img src={p.image || `${import.meta.env.BASE_URL}favicon.svg`} alt={p.name} className="w-full h-full object-cover"/>
                  {p.badge && <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded bg-lime-400 text-black">{p.badge}</span>}
                  <span className="absolute bottom-2 right-2 text-xs bg-black/60 backdrop-blur px-2 py-1 rounded-full border border-white/10">{p.stock} {t('in_stock')}</span>
                  <button onClick={()=>deleteProd(p.id)} title="Supprimer" className="absolute top-2 right-2 p-2 rounded-xl bg-red-600/90 text-white"><Trash2 size={14}/></button>
                </div>
                <div className="p-4">
                  <div className="text-[11px] tracking-widest text-lime-400 uppercase font-bold">{p.category}</div>
                  <Link to={`/product/${p.id}`} className="font-bold hover:text-lime-300">{p.name}</Link>
                  <div className="text-xs text-white/50 line-clamp-1">{p.subtitle}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.variants.map(v=> <span key={v.id} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{v.label} • {v.price.toFixed(2)} TND</span>)}
                  </div>
                  <div className="text-xs mt-2">Stock: <span className="font-bold text-lime-400">{p.stock}</span> codes • ⭐ {p.rating}</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>changeStock(p.id,-10)} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">-10</button>
                    <button onClick={()=>changeStock(p.id,-1)} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">-1</button>
                    <button onClick={()=>changeStock(p.id,1)} className="flex-1 py-2 rounded-xl bg-lime-400 text-black text-xs font-black">+1</button>
                    <button onClick={()=>changeStock(p.id,10)} className="flex-1 py-2 rounded-xl bg-lime-400 text-black text-xs font-black">+10</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visibleProds.length===0 && <div className="text-white/50 text-center py-8">{t('no_result')}</div>}
        </div>
      )}

      {tab==='orders' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button onClick={doRefresh} className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-sm font-black flex items-center gap-2">
              <RefreshCw size={15} className={spinning?'animate-spin':''}/> Actualiser les commandes
            </button>
            <span className="text-xs text-white/40">
              {cloud ? '☁️ Synchro auto toutes les 15s' : '📱 Mode local'} {lastSync && `• Dernière synchro ${lastSync.toLocaleTimeString('fr-FR')}`}
            </span>
          </div>
          <div className="flex gap-2 overflow-auto pb-2">
            {[
              {id:'all', label:`Toutes (${orders.length})`},
              {id:'pending', label:`⏳ À confirmer (${pendingCount})`},
              {id:'confirmed', label:'✅ Confirmées'},
              {id:'delivered', label:'📦 Livrées'},
              {id:'cancelled', label:'❌ Annulées'},
            ].map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)} className={`cat-pill px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${filter===f.id?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10 text-white/70'}`}>{f.label}</button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {filtered.length===0 && <div className="text-white/50 text-center py-8">Aucune commande dans ce filtre.</div>}
            {filtered.map(o=>(
              <div key={o.id} className={`p-4 rounded-2xl border ${isPending(o)?'bg-amber-500/5 border-amber-500/30':'bg-white/5 border-white/10'}`}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="font-bold text-sm">{o.id} • {o.customer?.name} • {o.total.toFixed(2)} TND • {o.method==='card'?'Carte':'À la livraison'}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${isPending(o)?'bg-amber-500/20 text-amber-300 border border-amber-500/30': o.status.includes('Annulée')?'bg-red-500/20 text-red-300 border border-red-500/30':'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>{o.status}</span>
                    <button onClick={()=>handleDeleteOrder(o.id)} title="Supprimer" className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 size={13}/></button>
                  </div>
                </div>
                <div className="text-xs text-white/60 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📧 {o.customer?.email}</span>
                  {o.customer?.phone && <a href={`tel:${o.customer.phone}`} className="font-bold text-emerald-300 flex items-center gap-1"><Phone size={12}/> {o.customer.phone}</a>}
                  {o.customer?.address && <span>📍 {o.customer.address}</span>}
                  <span>🕒 {new Date(o.date).toLocaleString('fr-FR')}</span>
                  <span>👤 {o.provider||''} {o.principal? `• ${String(o.principal).slice(0,12)}...`:''}</span>
                </div>
                <div className="text-xs mt-2 bg-black/30 rounded-xl p-2.5 border border-white/5">{o.items.map(i=> `${i.name} (${i.variantLabel}) ×${i.qty} → ${i.code}`).join(' | ')}</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {isPending(o) && (
                    <button onClick={()=>updateOrderStatus(o.id,'Confirmée • Codes disponibles')} className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-black flex items-center gap-1.5"><Check size={14}/> Confirmer la commande</button>
                  )}
                  <button onClick={()=>updateOrderStatus(o.id,'Payée • Codes disponibles')} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs">Marquer payée</button>
                  <button onClick={()=>updateOrderStatus(o.id,'Livrée')} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs flex items-center gap-1"><Truck size={12}/> Livrée</button>
                  <button onClick={()=>updateOrderStatus(o.id,'Annulée')} className="px-3 py-2 rounded-xl bg-red-500/20 text-red-300 text-xs flex items-center gap-1"><X size={12}/> Annuler</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='users' && (
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16}/>
            <input value={qUser} onChange={e=>setQUser(e.target.value)} placeholder="Rechercher nom, email, téléphone..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-lime-500/50 text-sm"/>
          </div>
          <p className="text-xs text-white/40 mt-2">Chaque compte créé sur le site (email, Discord, Facebook) + infos de ses commandes.</p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {visibleAccounts.map(a=>(
              <div key={a.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 text-black flex items-center justify-center font-black text-lg shrink-0">{(a.name||a.email||'?')[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{a.name||'Client'} {a.isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">ADMIN</span>}</div>
                    <div className="text-xs text-white/50 truncate">📧 {a.email||'—'} • {a.provider}</div>
                  </div>
                  {a.id!==user.id && !a.isAdmin && (
                    <button onClick={()=>handleDeleteAccount(a)} title="Supprimer ce compte" className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 shrink-0"><Trash2 size={14}/></button>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-white/50">Téléphone(s)</span><span className="font-bold">{a.phones.length? a.phones.map(ph=> <a key={ph} href={`tel:${ph}`} className="text-emerald-300 ml-2">📞 {ph}</a>) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Compte créé</span><span>{a.createdAt? new Date(a.createdAt).toLocaleString('fr-FR') : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Dernière activité</span><span>{a.lastSeen? new Date(a.lastSeen).toLocaleString('fr-FR') : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Commandes</span><span className="font-black text-lime-400">{a.ordersCount}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Total dépensé</span><span className="font-black text-emerald-400">{a.totalSpent.toFixed(2)} TND</span></div>
                  {a.orderIds.length>0 && <div className="text-white/40 pt-1">🧾 {a.orderIds.join(' • ')}</div>}
                </div>
              </div>
            ))}
          </div>
          {visibleAccounts.length===0 && <div className="text-white/50 text-center py-8">Aucun compte pour l'instant — ils apparaîtront ici dès qu'un client crée un compte ou commande.</div>}
        </div>
      )}

      {tab==='messages' && (
        <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {threads.length===0 && <div className="text-white/50 text-center py-8 text-sm">{t('chat_empty_admin')}</div>}
            {threads.map(th=>(
              <button key={th.userId} onClick={()=>openThread(th.userId)} className={`w-full text-left p-3 rounded-2xl border ${activeThread===th.userId?'bg-lime-400 border-lime-400 text-black':'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm truncate">{th.name}</div>
                  {th.unread>0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-black shrink-0">{th.unread}</span>}
                </div>
                <div className="text-xs text-white/60 truncate mt-0.5">{th.last?.sender==='admin' ? 'Toi : ' : ''}{typeof th.last?.text==='string' && th.last.text.startsWith('data:image') ? '📸 Reçu de paiement' : th.last?.text}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{th.last?.date ? new Date(th.last.date).toLocaleString('fr-FR') : ''} • {th.count} msg</div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col min-h-[50vh]">
            {!currentThread ? (
              <div className="flex-1 flex items-center justify-center text-white/40 text-sm">{t('chat_select_thread')}</div>
            ) : (
              <>
                <div className="font-black pb-2 border-b border-white/10">💬 {currentThread.name}</div>
                <div className="flex-1 space-y-2 overflow-y-auto py-3 max-h-[45vh]">
                  {threadMessages.map(m=>(
                    <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.sender==='admin' ? 'bg-lime-400 text-black ml-auto' : 'bg-white/10 border border-white/10 mr-auto'}`}>
                      {typeof m.text==='string' && m.text.startsWith('data:image')
                        ? <button type="button" onClick={()=>setLightbox(m.text)}><img src={m.text} alt="reçu" className="max-w-full rounded-xl max-h-72 object-contain"/></button>
                        : <div className="leading-snug">{m.text}</div>}
                      <div className="text-[10px] opacity-60 mt-0.5">{m.date ? new Date(m.date).toLocaleString('fr-FR') : ''}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleReply} className="flex gap-2 pt-2 border-t border-white/10">
                  <input value={reply} onChange={e=>setReply(e.target.value)} placeholder={t('chat_placeholder')} className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-lime-500"/>
                  <button className="px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black disabled:opacity-60" disabled={!reply.trim()}><Send size={16}/></button>
                </form>
                {lightbox && (
                  <div onClick={()=>setLightbox(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <img src={lightbox} alt="reçu plein écran" className="max-w-full max-h-full rounded-xl object-contain"/>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab==='tournaments' && (
        <div className="mt-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 grid md:grid-cols-4 gap-3">
            <input placeholder={t('tr_title_ph')} value={trnForm.title} onChange={e=>setTrnForm({...trnForm,title:e.target.value})} className="md:col-span-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <select value={trnForm.game} onChange={e=>setTrnForm({...trnForm,game:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
              <option value="valorant">Valorant</option><option value="lol">LoL</option><option value="battlenet">Battle.net</option><option value="steamfresh">Steam Fresh</option><option value="steam-games">Steam Games</option><option value="battlenet-games">BNet Games</option><option value="xbox-games">Xbox Games</option><option value="ps5-games">PS5 Games</option><option value="fc26">FC26</option><option value="fc27">FC27</option><option value="pubg">PUBG</option><option value="warzone">Warzone</option><option value="r6">Rainbow Six</option><option value="roblox">Roblox</option><option value="freefire">Free Fire</option><option value="other">Autres</option>
            </select>
            <select value={trnForm.status} onChange={e=>setTrnForm({...trnForm,status:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
              <option value="soon">{t('tr_soon')}</option><option value="open">{t('tr_open')}</option><option value="done">{t('tr_done')}</option><option value="pending">{t('tr_pending')}</option>
            </select>
            <input type="datetime-local" value={trnForm.date} onChange={e=>setTrnForm({...trnForm,date:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_prize')} value={trnForm.prize} onChange={e=>setTrnForm({...trnForm,prize:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_max')} type="number" value={trnForm.max_teams} onChange={e=>setTrnForm({...trnForm,max_teams:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_fee')} type="number" value={trnForm.entry_fee} onChange={e=>setTrnForm({...trnForm,entry_fee:e.target.value})} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_image_ph')} value={trnForm.image} onChange={e=>setTrnForm({...trnForm,image:e.target.value})} className="md:col-span-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <input placeholder={t('tr_rules')} value={trnForm.rules} onChange={e=>setTrnForm({...trnForm,rules:e.target.value})} className="md:col-span-4 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10"/>
            <button onClick={handleCreateTrn} className="md:col-span-4 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-2"><Plus size={16}/> {t('tr_create')}</button>
          </div>

          <div className="mt-4 space-y-3">
            {tournaments.map(tr=>(
              <div key={tr.id} className={`p-4 rounded-2xl border ${tr.status==='pending'?'bg-amber-500/5 border-amber-500/30':'bg-white/5 border-white/10'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <img src={tr.image || imgForGame(tr.game)} alt={tr.title} className="w-16 h-16 rounded-xl object-cover"/>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-bold">{tr.title} {tr.status==='pending' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">{t('tr_pending')}</span>}</div>
                    <div className="text-xs text-white/50">{tr.game} • {tr.date?new Date(tr.date).toLocaleString('fr-FR'):'—'} • 🏆 {tr.prize} • {regsFor(tr.id).length}/{tr.max_teams} • {tr.status}</div>
                  </div>
                  <select value={tr.status} onChange={e=>saveTournament({...tr, status:e.target.value})} className="px-2 py-2 rounded-xl bg-black/30 border border-white/10 text-xs">
                    <option value="soon">{t('tr_soon')}</option><option value="open">{t('tr_open')}</option><option value="done">{t('tr_done')}</option><option value="pending">{t('tr_pending')}</option>
                  </select>
                  <button onClick={()=>handleDeleteTrn(tr.id)} className="p-2 rounded-xl bg-red-500/20 text-red-400"><Trash2 size={14}/></button>
                </div>
                <TournamentManager tr={tr} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
