import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { initialProducts } from '../data/products'
import { supabase, isCloudEnabled } from '../lib/supabase'
import { sendWelcomeEmail } from '../lib/email'
import { isImageValue } from '../lib/storage'
import { fetchRiotStats } from '../lib/riot'
import { cleanRoster } from '../lib/roster'
import { getChampion } from '../lib/bracket'
import { discordTournament, discordRegistration, discordChampion, discordLfg, syncDiscordRole } from '../lib/discord'

const AuthCtx = createContext()
const cloud = isCloudEnabled

function genId(prefix='user'){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}` }
function genPrincipal(){ return 'aaaaa-aa-' + Math.random().toString(36).slice(2,7) + '-' + Math.random().toString(36).slice(2,7) }

// Simple demo hash (mode local uniquement)
const hashPw = (pw)=> { try { return btoa('ztc$'+pw) } catch { return 'hash_'+pw.length } }

// Emails propriétaires/admins => toujours admin (identifiants publics, pas des secrets)
const OWNER_EMAILS = [
  (import.meta.env.VITE_ADMIN_EMAIL || 'admin@ztc.shop').toLowerCase(),
  'apatchegaming@gmail.com',
  'sasorisescanor113@gmail.com',
]
const isOwnerEmail = (email)=> OWNER_EMAILS.includes((email||'').trim().toLowerCase())

function readUsers(){
  try { return JSON.parse(localStorage.getItem('ztc_users')||'[]') } catch { return [] }
}
function saveProfile(u){
  try{
    const users = readUsers()
    const idx = users.findIndex(x=> x.id===u.id)
    const prev = idx>=0 ? users[idx] : {}
    const entry = { id: u.id, name: u.name||'', email: u.email||'', provider: u.provider||'email', principal: u.principal||'', isAdmin: !!u.isAdmin || isOwnerEmail(u.email), createdAt: u.createdAt||new Date().toISOString(), lastSeen: new Date().toISOString(),
      // préserve les extras profil local (avatar/bannière/tél/naissance/sexe)
      ...(prev.avatar?{avatar:prev.avatar}:{}), ...(prev.banner?{banner:prev.banner}:{}), ...(prev.phone?{phone:prev.phone}:{}), ...(prev.birthdate?{birthdate:prev.birthdate}:{}), ...(prev.gender?{gender:prev.gender}:{}) }
    if(idx>=0){
      const keepHash = users[idx].passwordHash
      users[idx] = { ...entry, createdAt: users[idx].createdAt||entry.createdAt, ...(keepHash?{passwordHash: keepHash}:{}) }
      if(u.name) users[idx].name = u.name
      if(u.email) users[idx].email = u.email
    } else users.push(entry)
    localStorage.setItem('ztc_users', JSON.stringify(users))
  }catch{}
}

// Extras profil stockés localement (avatar/bannière/tél/naissance/sexe) —
// réinjectés quand le user cloud est reconstruit depuis Supabase au refresh.
// Clé dédiée par user id : survit au logout (ztc_user est écrasé à null au logout).
const EXTRAS_KEY = 'ztc_profile_extras'
const readExtrasById = (id)=>{
  if(!id) return {}
  try{
    const all = JSON.parse(localStorage.getItem(EXTRAS_KEY)||'{}')
    return all[id] || {}
  }catch{ return {} }
}
const writeExtrasById = (id, patch)=>{
  if(!id) return
  try{
    const all = JSON.parse(localStorage.getItem(EXTRAS_KEY)||'{}')
    all[id] = { ...(all[id]||{}), ...patch }
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(all))
  }catch{}
}
function readLocalExtras(id){
  const byId = readExtrasById(id)
  if(Object.keys(byId).length) return byId
  try{
    const u = JSON.parse(localStorage.getItem('ztc_user')||'null')
    if(u && u.id===id){
      const { avatar, banner, phone, birthdate, gender, games } = u
      return { ...(avatar?{avatar}:{}), ...(banner?{banner}:{}), ...(phone?{phone}:{}), ...(birthdate?{birthdate}:{}), ...(gender?{gender}:{}), ...(Array.isArray(games)?{games}:{}) }
    }
  }catch{}
  return {}
}
// Fusionne les extras persistés dans un user frais (tous les logins)
const withExtras = (u)=> ({ ...u, ...readLocalExtras(u.id) })

// ---------- Mapping cloud <-> app ----------
const mapCloudOrder = (r)=> ({
  id: r.id, date: r.created_at,
  items: r.items||[], total: Number(r.total||0), method: r.method||'card',
  customer: r.customer||{}, userId: r.user_id, provider: r.customer?.provider||'email',
  principal: r.customer?.principal||'',
  status: r.status||'En attente de confirmation (paiement reçu)',
  cloud: true,
})
const mapCloudProduct = (r)=> ({
  id: r.id, category: r.category, name: r.name, subtitle: r.subtitle||'',
  image: r.image||'', badge: r.badge||null, description: r.description||'',
  variants: r.variants||[], stock: r.stock??0, rating: Number(r.rating||5),
})
const mapCloudMessage = (r)=> ({
  id: r.id, userId: r.user_id, orderId: r.order_id||null,
  sender: r.sender, name: r.name||'', text: r.text||'',
  isRead: !!r.is_read, date: r.created_at, cloud: true,
})
const toCloudProduct = (p)=> ({
  id: p.id, category: p.category, name: p.name, subtitle: p.subtitle||'',
  image: p.image||'', badge: p.badge||null, description: p.description||'',
  variants: p.variants||[], stock: p.stock??0, rating: p.rating??5,
})

function mergeOrders(localArr, cloudArr){
  const map = new Map()
  localArr.forEach(o=> map.set(o.id, o))
  cloudArr.forEach(o=> map.set(o.id, o)) // le cloud gagne en cas de conflit
  return [...map.values()].sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(()=>{
    try{
      const u = JSON.parse(localStorage.getItem('ztc_user')||'null')
      if(u) return u
      const old = JSON.parse(localStorage.getItem('ii_user')||'null')
      if(old) return { id: genId('ii'), name: 'Joueur', email: '', provider: old.provider||'Internet Identity', principal: old.principal, isAdmin: !!old.isAdmin, createdAt: old.createdAt||new Date().toISOString() }
      return null
    }catch{return null}
  })
  const [orders, setOrders] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('orders')||'[]')}catch{return []}
  })
  const [products, setProductsState] = useState(()=>{
    try{
      const stored = JSON.parse(localStorage.getItem('products_db')||'null')
      if(!stored) return null
      if(!Array.isArray(stored)) return null
      const ids = new Set(stored.map(p=>p.id))
      const missing = initialProducts.filter(p=>!ids.has(p.id))
      const byId = Object.fromEntries(initialProducts.map(p=>[p.id,p]))
      const synced = stored.map(p=> byId[p.id] ? { ...p, image: byId[p.id].image, category: byId[p.id].category, name: byId[p.id].name, subtitle: byId[p.id].subtitle, variants: byId[p.id].variants } : p)
      return missing.length ? [...synced, ...missing] : synced
    }catch{return null}
  })
  const [cloudProfiles, setCloudProfiles] = useState(null) // null = pas admin cloud ou pas chargé
  const sbUserId = useRef(null)

  useEffect(()=>{ try{ localStorage.setItem('ztc_user', JSON.stringify(user)) }catch{} }, [user])
  useEffect(()=> localStorage.setItem('ii_user', JSON.stringify(user)), [user])
  useEffect(()=> localStorage.setItem('orders', JSON.stringify(orders.filter(o=>!o.cloud || o.syncError))), [orders])
  useEffect(()=> { if(products) localStorage.setItem('products_db', JSON.stringify(products)) }, [products])

  // ---------- Refresh cloud ----------
  const refreshCloudOrders = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudOrder)
      setOrders(prev=> mergeOrders(prev, mapped))
    }catch(e){ console.warn('cloud orders:', e.message) }
  }, [])

  const refreshCloudProducts = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('products').select('*')
      if(error) throw error
      if(data && data.length) setProductsState(data.map(mapCloudProduct))
    }catch(e){ console.warn('cloud products:', e.message) }
  }, [])

  const refreshCloudProfiles = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('profiles').select('*').limit(300)
      if(error) throw error
      setCloudProfiles(data||[])
    }catch{ setCloudProfiles(null) }
  }, [])

  const [messages, setMessages] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_messages')||'[]')}catch{return []}
  })
  useEffect(()=> localStorage.setItem('ztc_messages', JSON.stringify(messages.filter(m=>!m.cloud))), [messages])

  // ---- VIP Membership (29.99 TND/mois, -5% marketplace) ----
  const VIP_PRICE = 29.99
  const VIP_DISCOUNT = 0.05
  const isVipActive = (u=user)=>{
    if(!u) return false
    if(u.vipUntil && new Date(u.vipUntil) <= new Date()) return false
    return !!u.isVip
  }
  const [vipSubs, setVipSubs] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_vipsubs')||'[]')}catch{return []}
  })
  useEffect(()=> localStorage.setItem('ztc_vipsubs', JSON.stringify(vipSubs.filter(x=>!x.cloud))), [vipSubs])
  const mapCloudVip = (r)=> ({ id: r.id, userId: r.user_id, months: r.months||1, amount: Number(r.amount||VIP_PRICE), status: r.status||'pending', date: r.created_at, cloud: true })
  const refreshVipSubs = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('vip_subs').select('*').order('created_at', { ascending: false }).limit(200)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudVip)
      setVipSubs(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()]
      })
    }catch(e){ console.warn('cloud vip:', e.message) }
  }, [])
  const myVipSub = ()=> user ? vipSubs.filter(x=> x.userId===user.id).sort((a,b)=> new Date(b.date||0)-new Date(a.date||0))[0] : null
  const createVipSub = async ()=>{
    if(!user) throw new Error('login')
    const pending = vipSubs.some(x=> x.userId===user.id && x.status==='pending')
    if(pending) throw new Error('exists')
    const sub = {
      id: genId('vip'), userId: user.id, months: 1, amount: VIP_PRICE, status: 'pending',
      date: new Date().toISOString(), cloud: !!(cloud && user.cloud),
    }
    if(sub.cloud){
      try{
        const { data, error } = await supabase.from('vip_subs').insert({
          user_id: user.id, months: 1, amount: VIP_PRICE, status: 'pending',
        }).select()
        if(error) throw error
        if(data?.[0]) { const m = mapCloudVip(data[0]); setVipSubs(prev=> [m, ...prev]); refreshVipSubs(); return m }
      }catch(e){
        const m = String(e.message||'')
        if(/vip_subs/i.test(m)) throw new Error('need_sql')
        throw e
      }
    }
    setVipSubs(prev=> [sub, ...prev])
    return sub
  }
  const confirmVipSub = async (id)=>{
    if(!user?.isAdmin) throw new Error('login')
    const target = vipSubs.find(x=> x.id===id)
    if(!target) return
    const until = new Date(Date.now() + 30*864e5).toISOString()
    setVipSubs(prev=> prev.map(x=> x.id===id ? {...x, status:'active'} : x))
    if(cloud && target.cloud){
      const { error: e1 } = await supabase.from('vip_subs').update({ status: 'active' }).eq('id', id)
      if(e1) throw e1
      const { error: e2 } = await supabase.from('profiles').update({ is_vip: true, vip_until: until }).eq('id', target.userId)
      if(e2) throw e2
      refreshVipSubs()
    }else{
      // Mode local : flag direct sur le compte
      try{
        const users = readUsers().map(u=> u.id===target.userId ? {...u, isVip: true, vipUntil: until} : u)
        localStorage.setItem('ztc_users', JSON.stringify(users))
        if(user.id===target.userId){ const me = {...user, isVip: true, vipUntil: until}; setUser(me) }
      }catch{}
    }
    return until
  }
  const rejectVipSub = async (id)=>{
    if(!user?.isAdmin) throw new Error('login')
    const target = vipSubs.find(x=> x.id===id)
    setVipSubs(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target?.cloud){
      const { error } = await supabase.from('vip_subs').delete().eq('id', id)
      if(error){ refreshVipSubs(); throw new Error('del_need_policy') }
    }
  }

  // ---- Wallet ZTC (1 TND = 1 coin, recharge D17 validée par l'admin) ----
  const COIN_RATE = 1 // 1 TND = 1 coin
  const CASHBACK_RATE = 0.03 // +3% en coins quand on paie avec le wallet (crédité à la confirmation)
  const [recharges, setRecharges] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_recharges')||'[]')}catch{return []}
  })
  useEffect(()=> localStorage.setItem('ztc_recharges', JSON.stringify(recharges.filter(x=>!x.cloud))), [recharges])
  const mapCloudRecharge = (r)=> ({ id: r.id, userId: r.user_id, amount: Number(r.amount_tnd||0), coins: r.coins||0, method: r.method||'D17', phone: r.phone||'', status: r.status||'pending', date: r.created_at, cloud: true })
  const refreshRecharges = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('recharges').select('*').order('created_at', { ascending: false }).limit(200)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudRecharge)
      setRecharges(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()]
      })
    }catch(e){ console.warn('cloud recharges:', e.message) }
  }, [])
  const myRecharges = ()=> user ? recharges.filter(x=> x.userId===user.id).sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)) : []
  const createRecharge = async ({ amountTnd, phone })=>{
    if(!user) throw new Error('login')
    const amount = Math.floor(Number(amountTnd)||0)
    if(amount < 1) throw new Error('amount')
    const coins = Math.floor(amount * COIN_RATE)
    const rec = {
      id: genId('rch'), userId: user.id, amount, coins, method: 'D17',
      phone: (phone||'').replace(/[\s.-]/g,''), status: 'pending',
      date: new Date().toISOString(), cloud: !!(cloud && user.cloud),
    }
    if(rec.cloud){
      try{
        const { data, error } = await supabase.from('recharges').insert({
          user_id: user.id, amount_tnd: amount, coins, method: 'D17', phone: rec.phone, status: 'pending',
        }).select()
        if(error) throw error
        if(data?.[0]) { const m = mapCloudRecharge(data[0]); setRecharges(prev=> [m, ...prev]); refreshRecharges(); return m }
      }catch(e){
        if(/recharges/i.test(String(e.message||''))) throw new Error('need_sql')
        throw e
      }
    }
    setRecharges(prev=> [rec, ...prev])
    return rec
  }
  const confirmRecharge = async (id)=>{
    if(!user?.isAdmin) throw new Error('login')
    const target = recharges.find(x=> x.id===id)
    if(!target || target.status!=='pending') return
    setRecharges(prev=> prev.map(x=> x.id===id ? {...x, status:'approved'} : x))
    if(cloud && target.cloud){
      const { error: e1 } = await supabase.from('recharges').update({ status: 'approved' }).eq('id', id)
      if(e1) throw e1
      await creditBalance(target.userId, target.coins, true)
      refreshRecharges()
    }else{
      await creditBalance(target.userId, target.coins, false)
    }
  }
  const rejectRecharge = async (id)=>{
    if(!user?.isAdmin) throw new Error('login')
    const target = recharges.find(x=> x.id===id)
    setRecharges(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target?.cloud){
      const { error } = await supabase.from('recharges').delete().eq('id', id)
      if(error){ refreshRecharges(); throw new Error('del_need_policy') }
    }
  }
  // Crédite/débite le solde d'un membre.
  // viaCloud=true => base Supabase (comptes cloud) ; false => localStorage.
  const creditBalance = async (uid, amount, viaCloud)=>{
    if(!uid || !amount) return
    if(viaCloud && cloud){
      const { data: prof } = await supabase.from('profiles').select('ztc_balance').eq('id', uid).single()
      const cur = Number(prof?.ztc_balance || 0)
      const { error } = await supabase.from('profiles').update({ ztc_balance: cur + amount }).eq('id', uid)
      if(error) throw error
      if(user?.id===uid) setUser(prev=> prev ? {...prev, balance: cur + amount} : prev)
    }else{
      try{
        const users = readUsers().map(u=> u.id===uid ? {...u, balance: Number(u.balance||0)+amount} : u)
        localStorage.setItem('ztc_users', JSON.stringify(users))
      }catch{}
      if(user?.id===uid) setUser(prev=> prev ? {...prev, balance: Number(prev.balance||0)+amount} : prev)
    }
  }
  // Débite le solde pour un paiement wallet (1 coin = 1 TND)
  const spendBalance = async (amount)=>{
    if(!user) throw new Error('login')
    const need = Math.round(Number(amount||0) * 100) / 100
    if(need <= 0) throw new Error('amount')
    const cur = Number(user.balance||0)
    if(cur < need) throw new Error('insufficient')
    await creditBalance(user.id, -need, cloud && user.cloud)
    return Math.round((cur - need) * 100) / 100
  }
  // Recharge solde + statut VIP depuis la base (après validation admin)
  const refreshMyBalance = useCallback(async ()=>{
    if(!cloud) return
    const uid = sbUserId.current
    if(!uid) return
    try{
      const { data } = await supabase.from('profiles').select('ztc_balance,is_vip,vip_until').eq('id', uid).single()
      if(data) setUser(prev=> prev ? {...prev, balance: Number(data.ztc_balance||0), isVip: !!data.is_vip, vipUntil: data.vip_until || prev.vipUntil} : prev)
    }catch{}
  }, [cloud])

  // ---- Tournois ----
  const REMOVED_TOURNAMENT_IDS = ['val-cup-1'] // tournois supprimés : purgés du cache local aussi
  const seedTournaments = [
    { id:'lol-clash-1', game:'lol', title:'LoL Tunisian Showdown', date: new Date(Date.now()+23*864e5).toISOString(), prize:'2000 TND cash prize', max_teams:32, entry_fee:0, status:'soon', rules:'5v5 Summoners Rift • Tournoi à élimination directe.', image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10' },
  ]
  const [tournaments, setTournamentsState] = useState(()=>{
    try{ const s = JSON.parse(localStorage.getItem('ztc_tournaments')||'null'); const arr = Array.isArray(s) && s.length ? s : seedTournaments; return arr.filter(x=> !REMOVED_TOURNAMENT_IDS.includes(x.id)) }catch{ return seedTournaments }
  })
  const [regs, setRegs] = useState(()=>{
    try{ const r = JSON.parse(localStorage.getItem('ztc_regs')||'[]'); return (Array.isArray(r) ? r : []).filter(x=> !REMOVED_TOURNAMENT_IDS.includes(x.tournament_id)) }catch{return []}
  })
  // ---- Équipes créées directement par les clients (standalone) ----
  const [teams, setTeams] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_teams')||'[]')}catch{return []}
  })
  const [joinReqs, setJoinReqs] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_join_reqs')||'[]')}catch{return []}
  })
  // Bannières équipes partagées (cloud, visibles par tous) — clé = nom normalisé
  const [teamAssets, setTeamAssets] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('ztc_team_assets')||'{}') }catch{return {}} })
  useEffect(()=>{ try{ localStorage.setItem('ztc_team_assets', JSON.stringify(teamAssets)) }catch{} }, [teamAssets])
  // Infos équipe partagées (liens site web/discord/youtube/instagram, localisation, à propos) — cloud
  const [teamInfos, setTeamInfos] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('ztc_team_infos')||'{}') }catch{return {}} })
  useEffect(()=>{ try{ localStorage.setItem('ztc_team_infos', JSON.stringify(teamInfos)) }catch{} }, [teamInfos])
  useEffect(()=> localStorage.setItem('ztc_tournaments', JSON.stringify(tournaments.filter(x=>!x.cloud))), [tournaments])
  useEffect(()=> localStorage.setItem('ztc_regs', JSON.stringify(regs.filter(x=>!x.cloud))), [regs])
useEffect(()=> localStorage.setItem('ztc_teams', JSON.stringify(teams.filter(x=>!x.cloud))), [teams])
  useEffect(()=> localStorage.setItem('ztc_join_reqs', JSON.stringify(joinReqs.filter(x=>!x.cloud))), [joinReqs])

  const mapCloudTournament = (r)=> ({ id: r.id, game: r.game, title: r.title, date: r.date, prize: r.prize||'', max_teams: r.max_teams??16, entry_fee: Number(r.entry_fee||0), status: r.status||'soon', rules: r.rules||'', image: r.image||'', video: r.video||'', elimination: r.elimination||'single', final_format: r.final_format||'BO1', createdBy: r.created_by||null, bracket: Array.isArray(r.bracket) ? r.bracket : [], cloud: true })
  const mapCloudReg = (r)=> ({ id: r.id, tournament_id: r.tournament_id, team: r.team, captain: r.captain||'', phone: r.phone||'', game_id: r.game_id||'', logo: r.logo||'', userId: r.user_id, date: r.created_at, checkedIn: !!r.checked_in, checkedInAt: r.checked_in_at||null, roster: Array.isArray(r.roster) ? r.roster : null, cloud: true })
  const mapCloudJoin = (r)=> ({ id: r.id, tournament_id: r.tournament_id, regId: r.reg_id, userId: r.user_id, userName: r.user_name||'', userEmail: r.user_email||'', message: r.message||'', status: r.status||'pending', date: r.created_at, cloud: true })
  const mapCloudTeam = (r)=> ({ id: r.id, name: r.name, game: r.game||'valorant', logo: r.logo||'', captain: r.captain||'', phone: r.phone||'', description: r.description||'', roster: Array.isArray(r.roster) ? r.roster : null, userId: r.user_id, date: r.created_at, cloud: true })

  const refreshTournaments = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('tournaments').select('*').order('date', { ascending: true })
      if(error) throw error
      if(data){
        const mapped = data.map(mapCloudTournament)
        setTournamentsState(prev=>{
          const map = new Map()
          prev.forEach(x=> map.set(x.id, x))
          mapped.forEach(x=> map.set(x.id, x))
          return [...map.values()].filter(x=> !REMOVED_TOURNAMENT_IDS.includes(x.id))
        })
      }
    }catch(e){ console.warn('cloud tournaments:', e.message) }
  }, [])
  const refreshRegs = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('tournament_regs').select('*').order('created_at', { ascending: false }).limit(300)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudReg)
      setRegs(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()].filter(x=> !REMOVED_TOURNAMENT_IDS.includes(x.tournament_id))
      })
    }catch(e){ console.warn('cloud regs:', e.message) }
  }, [])
  const refreshTeams = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false }).limit(300)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudTeam)
      setTeams(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()]
      })
    }catch(e){ console.warn('cloud teams:', e.message) }
  }, [])
  // ---- LFG / matchmaking ----
  const mapCloudLfg = (r)=> ({
    id: r.id, userId: r.user_id, authorName: r.author_name || '',
    kind: r.kind || 'player', game: r.game || 'valorant', rank: r.rank || '',
    roles: Array.isArray(r.roles) ? r.roles : [], region: r.region || '',
    description: r.description || '', contact: r.contact || '',
    teamName: r.team_name || '', status: r.status || 'open',
    date: r.created_at, cloud: true,
  })
  const [lfgPosts, setLfgPosts] = useState([])
  const refreshLfg = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('lfg_posts').select('*').order('created_at', { ascending: false }).limit(200)
      if(!error && data) setLfgPosts(data.map(mapCloudLfg))
    }catch(e){ console.warn('cloud lfg:', e.message) }
  }, [])
  const createLfgPost = async ({ kind='player', game, rank, roles, region, description, contact, teamName })=>{
    if(!user) throw new Error('login')
    if(!(cloud && user.cloud)) throw new Error('cloud_only')
    const desc = String(description || '').trim().slice(0, 600)
    if(desc.length < 10) throw new Error('description')
    const row = {
      user_id: user.id, author_name: user.name || user.email?.split('@')[0] || 'Joueur',
      kind: kind === 'team' ? 'team' : 'player', game: game || 'valorant',
      rank: String(rank || '').slice(0, 40), roles: (roles || []).slice(0, 5),
      region: String(region || '').slice(0, 40), description: desc,
      contact: String(contact || '').slice(0, 120),
      team_name: kind === 'team' ? String(teamName || user.name || '').slice(0, 60) : '',
      status: 'open',
    }
    const { data, error } = await supabase.from('lfg_posts').insert(row).select()
    if(error){
      if(/lfg_posts|relation|does not exist/i.test(String(error.message||''))) throw new Error('need_sql')
      throw error
    }
    if(data?.[0]){
      const m = mapCloudLfg(data[0])
      setLfgPosts(prev=> [m, ...prev])
      discordLfg(m).catch(()=>{})
      return m
    }
  }
  const closeLfgPost = async (id, status='closed')=>{
    const target = lfgPosts.find(x=> x.id===id)
    if(!target) throw new Error('post')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    setLfgPosts(prev=> prev.map(x=> x.id===id ? { ...x, status } : x))
    if(cloud && target.cloud){
      const { error } = await supabase.from('lfg_posts').update({ status }).eq('id', id)
      if(error) throw error
      refreshLfg()
    }
  }
  const deleteLfgPost = async (id)=>{
    const target = lfgPosts.find(x=> x.id===id)
    if(!target) throw new Error('post')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    setLfgPosts(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target.cloud){
      const { error } = await supabase.from('lfg_posts').delete().eq('id', id)
      if(error) throw error
      refreshLfg()
    }
  }
  // ---- Rapports de score (vérification Riot) ----
  const mapCloudReport = (r)=> ({
    id: r.id, tournamentId: r.tournament_id, round: r.round, matchIndex: r.match_index,
    matchId: r.match_id || '', teamA: r.team_a || '', teamB: r.team_b || '',
    scoreA: r.score_a ?? 0, scoreB: r.score_b ?? 0,
    riotMatchId: r.riot_match_id || '', screenshotUrl: r.screenshot_url || '',
    note: r.note || '', reporterId: r.reporter_id, reporterName: r.reporter_name || '',
    status: r.status || 'pending', verified: r.verified || null,
    date: r.created_at, decidedAt: r.decided_at || null, cloud: true,
  })
  const [matchReports, setMatchReports] = useState([])
  const refreshMatchReports = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('match_reports').select('*').order('created_at', { ascending: false }).limit(300)
      if(!error && data) setMatchReports(data.map(mapCloudReport))
    }catch(e){ console.warn('cloud reports:', e.message) }
  }, [])
  const submitMatchReport = async ({ tournamentId, round, matchIndex, matchId, teamA, teamB, scoreA, scoreB, riotMatchId, screenshotUrl, note })=>{
    if(!user) throw new Error('login')
    if(!(cloud && user.cloud)) throw new Error('cloud_only')
    const sa = Number(scoreA), sb = Number(scoreB)
    if(!Number.isFinite(sa) || !Number.isFinite(sb) || sa < 0 || sb < 0) throw new Error('score')
    if(sa === sb) throw new Error('draw')
    const row = {
      tournament_id: tournamentId, round: Number(round)||0, match_index: Number(matchIndex)||0,
      match_id: String(matchId || ''), team_a: String(teamA || ''), team_b: String(teamB || ''),
      score_a: sa, score_b: sb,
      riot_match_id: String(riotMatchId || '').trim().toUpperCase().slice(0, 40),
      screenshot_url: String(screenshotUrl || '').trim().slice(0, 500),
      note: String(note || '').trim().slice(0, 300),
      reporter_id: user.id, reporter_name: user.name || user.email?.split('@')[0] || 'Capitaine',
      status: 'pending',
    }
    const { data, error } = await supabase.from('match_reports').insert(row).select()
    if(error){
      if(/match_reports|relation|does not exist/i.test(String(error.message||''))) throw new Error('need_sql')
      throw error
    }
    if(data?.[0]){
      const m = mapCloudReport(data[0])
      setMatchReports(prev=> [m, ...prev])
      return m
    }
  }
  const decideMatchReport = async (id, status)=>{
    if(!user?.isAdmin) throw new Error('login')
    const patch = { status, decided_at: new Date().toISOString() }
    setMatchReports(prev=> prev.map(x=> x.id===id ? { ...x, ...patch } : x))
    if(cloud){
      const { error } = await supabase.from('match_reports').update(patch).eq('id', id)
      if(error) throw error
      refreshMatchReports()
    }
  }
  const deleteMatchReport = async (id)=>{
    const target = matchReports.find(x=> x.id===id)
    if(!target) return
    if(!user || (!user.isAdmin && target.reporterId!==user.id)) throw new Error('login')
    setMatchReports(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target.cloud){
      const { error } = await supabase.from('match_reports').delete().eq('id', id)
      if(error) throw error
    }
  }
  const refreshTeamAssets = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('team_assets').select('*').limit(300)
      if(error) throw error
      if(data){
        const obj = {}
        data.forEach(r=>{ if(r.team_name) obj[String(r.team_name).toLowerCase()] = r.banner || '' })
        setTeamAssets(prev=> ({ ...prev, ...obj }))
      }
    }catch(e){ console.warn('cloud team assets:', e.message) }
  }, [])
  const saveTeamAsset = async (teamName, banner)=>{
    const key = String(teamName||'').trim().toLowerCase()
    if(!key) throw new Error('team')
    setTeamAssets(prev=> ({ ...prev, [key]: banner||'' }))
    if(cloud && user?.cloud){
      try{
        const { error } = await supabase.from('team_assets').upsert(
          { team_name: key, banner: banner||null, updated_by: sbUserId.current || user.id },
          { onConflict: 'team_name' })
        if(error) throw error
      }catch(e){ console.warn('cloud save team asset:', e.message); throw new Error('need_sql_assets') }
    }
    return banner
  }
  const refreshTeamInfos = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('team_assets').select('*').limit(300)
      if(error) throw error
      if(data){
        const obj = {}
        data.forEach(r=>{
          if(!r.team_name) return
          const info = {}
          ;['location','website','discord','youtube','instagram','about'].forEach(k=>{ if(r[k]) info[k] = r[k] })
          obj[String(r.team_name).toLowerCase()] = info
        })
        setTeamInfos(prev=> ({ ...prev, ...obj }))
      }
    }catch(e){ console.warn('cloud team infos:', e.message) }
  }, [])
  const saveTeamExtras = async (teamName, patch)=>{
    const key = String(teamName||'').trim().toLowerCase()
    if(!key) throw new Error('team')
    setTeamInfos(prev=> ({ ...prev, [key]: { ...(prev[key]||{}), ...patch } }))
    if(cloud && user?.cloud){
      try{
        const { data: upd, error } = await supabase.from('team_assets').update(patch).eq('team_name', key).select()
        if(error) throw error
        if(!upd || upd.length===0){
          const { error: e2 } = await supabase.from('team_assets').insert({ team_name: key, ...patch, updated_by: sbUserId.current || user.id })
          if(e2) throw e2
        }
      }catch(e){ console.warn('cloud save team extras:', e.message) }
    }
  }
  // Photos/bannières profils partagées (visibles par tous) — clé = user id
  const [profileAssets, setProfileAssets] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('ztc_profile_assets')||'{}') }catch{return {}} })
  useEffect(()=>{ try{ localStorage.setItem('ztc_profile_assets', JSON.stringify(profileAssets)) }catch{} }, [profileAssets])
  const refreshProfileAssets = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('profile_assets').select('*').limit(300)
      if(error) throw error
      if(data){
        const obj = {}
        data.forEach(r=>{ if(r.id) obj[r.id] = { name: r.name||'', avatar: r.avatar||'', banner: r.banner||'', games: Array.isArray(r.games) ? r.games : [] } })
        setProfileAssets(prev=> ({ ...prev, ...obj }))
      }
    }catch(e){ console.warn('cloud profile assets:', e.message) }
  }, [])
  const refreshJoinReqs = useCallback(async ()=>{    if(!cloud) return
    try{
      const { data, error } = await supabase.from('tournament_join_requests').select('*').order('created_at', { ascending: false }).limit(300)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudJoin)
      setJoinReqs(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()]
      })
    }catch(e){ console.warn('cloud join reqs:', e.message) }
  }, [])

  const refreshCloudMessages = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(300)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudMessage)
      setMessages(prev=> {
        const map = new Map()
        prev.forEach(m=> map.set(m.id, m))
        mapped.forEach(m=> map.set(m.id, m))
        return [...map.values()].sort((a,b)=> new Date(a.date||0) - new Date(b.date||0))
      })
    }catch(e){ console.warn('cloud messages:', e.message) }
  }, [])

  // ---- XP / récompenses ----
  const [xpLogs, setXpLogs] = useState([])
  const [rewardClaims, setRewardClaims] = useState([])
  const tournamentXpAwardsInFlight = useRef(new Set())
  const xpOf = (id)=> Number(((cloudProfiles||[]).find(p=>p.id===id)||{}).xp || 0)
  const refreshXp = useCallback(async ()=>{
    if(!cloud) return
    const uid = sbUserId.current
    if(uid){
      try{
        const { data } = await supabase.from('profiles').select('xp,streak,last_checkin').eq('id', uid).single()
        if(data) setUser(u=> u ? { ...u, xp: Number(data.xp || 0), streak: Number(data.streak || 0), lastCheckin: data.last_checkin || null } : u)
      }catch{}
      try{
        const { data } = await supabase.from('xp_logs').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100)
        setXpLogs(data||[])
      }catch(e){ console.warn('xp logs:', e.message) }
    }
    try{
      const { data } = await supabase.from('reward_claims').select('*').order('created_at', { ascending: false }).limit(300)
      setRewardClaims(data||[])
    }catch(e){ console.warn('reward claims:', e.message) }
  }, [cloud])

  // ---- Notifications ----
  const [notifications, setNotifications] = useState([])
  const [notifReady, setNotifReady] = useState(true)
  const refreshNotifications = useCallback(async ()=>{
    if(!cloud) return
    const uid = sbUserId.current
    if(!uid){ setNotifications([]); return }
    try{
      const { data, error } = await supabase.from('notifications').select('*')
        .eq('user_id', uid).order('created_at', { ascending: false }).limit(60)
      if(error) throw error
      setNotifications(data || [])
      setNotifReady(true)
    }catch(e){
      console.warn('notifications:', e.message)
      setNotifReady(false)
    }
  }, [cloud])
  const markNotifRead = async (id)=>{
    const now = new Date().toISOString()
    setNotifications(list=> list.map(n=> n.id===id ? { ...n, read_at: n.read_at || now } : n))
    if(!cloud || !sbUserId.current) return
    try{ await supabase.from('notifications').update({ read_at: now }).eq('id', id) }catch{}
  }
  const markAllNotifsRead = async ()=>{
    const now = new Date().toISOString()
    setNotifications(list=> list.map(n=> n.read_at ? n : { ...n, read_at: now }))
    const uid = sbUserId.current
    if(!cloud || !uid) return
    try{ await supabase.from('notifications').update({ read_at: now }).eq('user_id', uid).is('read_at', null) }catch{}
  }
  const unreadNotifications = notifications.filter(n=> !n.read_at).length

  // ---- Sprint 2 : série, missions, badges ----
  const [badges, setBadges] = useState([])
  const [dailyClaims, setDailyClaims] = useState([])
  const [progressReady, setProgressReady] = useState(true)
  const refreshProgress = useCallback(async ()=>{
    if(!cloud) return
    const uid = sbUserId.current
    if(!uid){ setBadges([]); setDailyClaims([]); return }
    try{
      const { data, error } = await supabase.rpc('sync_badges')
      if(error) throw error
      setBadges(Array.isArray(data) ? data : [])
      setProgressReady(true)
    }catch(e){
      console.warn('badges:', e.message)
      setProgressReady(false)
    }
    try{
      const day = new Date().toISOString().slice(0,10)
      const { data } = await supabase.from('daily_claims').select('code,day').eq('user_id', uid).eq('day', day)
      setDailyClaims((data||[]).map(x=>x.code))
    }catch{ setDailyClaims([]) }
  }, [cloud])

  const dailyCheckin = async ()=>{
    if(!cloud || !user?.cloud) throw new Error('login')
    const { data, error } = await supabase.rpc('daily_checkin')
    if(error) throw error
    await refreshXp()
    await refreshProgress()
    return data
  }

  const claimMission = async (code)=>{
    if(!cloud || !user?.cloud) throw new Error('login')
    const { data, error } = await supabase.rpc('claim_mission', { p_code: code })
    if(error) throw error
    await refreshXp()
    await refreshProgress()
    return data
  }

  const awardXp = async (action, ref=null)=>{
    if(!cloud || !user?.cloud) return null
    const tournamentRef = action === 'tournament_reg' && ref ? String(ref) : null
    const uid = sbUserId.current
    const awardKey = tournamentRef && uid ? `${uid}:${tournamentRef}` : null
    if(awardKey && tournamentXpAwardsInFlight.current.has(awardKey)) return null
    if(awardKey) tournamentXpAwardsInFlight.current.add(awardKey)
    try{
      if(awardKey){
        const { data, error } = await supabase.from('xp_logs').select('id')
          .eq('user_id', uid).eq('action', 'tournament_reg').eq('ref', tournamentRef).limit(1)
        if(error) throw error
        if(data?.length) return null
      }
      const { data, error } = await supabase.rpc('award_xp', { p_action: action, p_ref: ref ? String(ref) : null })
      if(error) throw error
      if(data!=null){
        setUser(u=> u ? { ...u, xp: Number(data) } : u)
        refreshXp()
      }
      return data
    }catch(e){ console.warn('award_xp:', e.message); return null }
    finally{ if(awardKey) tournamentXpAwardsInFlight.current.delete(awardKey) }
  }

  const claimReward = async (tier)=>{
    if(!cloud || !user?.cloud) throw new Error('login')
    const { data, error } = await supabase.rpc('claim_reward', { p_tier: tier })
    if(error) throw error
    await refreshXp()
    return data
  }

  const decideReward = async (id, status)=>{
    if(!user?.isAdmin) throw new Error('login')
    // RPC : refuse + rembourse l'XP débité (fallback direct si le SQL v3 n'est pas exécuté)
    const { error } = await supabase.rpc('decide_reward', { p_id: id, p_status: status })
    if(error){
      const missing = error.code === 'PGRST202' || /Could not find the function|schema cache/i.test(String(error.message || ''))
      if(!missing) throw error
      const { error: e2 } = await supabase.from('reward_claims')
        .update({ status, decided_at: new Date().toISOString() }).eq('id', id)
      if(e2) throw e2
    }
    await refreshXp()
  }

  const inviteLink = user?.cloud
    ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}login?ref=${user.id}`
    : ''

  const refreshAll = useCallback(()=>{
    refreshCloudOrders(); refreshCloudProducts(); refreshCloudProfiles(); refreshCloudMessages(); refreshTournaments(); refreshRegs(); refreshJoinReqs(); refreshTeams(); refreshVipSubs(); refreshRecharges(); refreshTeamAssets(); refreshTeamInfos(); refreshProfileAssets(); refreshXp(); refreshNotifications(); refreshProgress(); refreshLfg(); refreshMatchReports()
  }, [refreshCloudOrders, refreshCloudProducts, refreshCloudProfiles, refreshCloudMessages, refreshTournaments, refreshRegs, refreshJoinReqs, refreshTeams, refreshVipSubs, refreshRecharges, refreshTeamAssets, refreshTeamInfos, refreshProfileAssets, refreshXp, refreshNotifications, refreshProgress, refreshLfg, refreshMatchReports])

  // Capture du parrainage : ?ref=<user_id> → stocké jusqu'à l'inscription
  useEffect(()=>{
    try{
      const r = new URLSearchParams(window.location.search).get('ref')
      if(r && /^[0-9a-f-]{36}$/i.test(r)) localStorage.setItem('ztc_ref', r)
    }catch{}
  }, [])

  // Session cloud au démarrage + realtime + refresh au focus
  useEffect(()=>{
    if(!cloud) return
    let mounted = true
    supabase.auth.getSession().then(async ({ data })=>{
      const s = data?.session
      if(s && mounted) await buildCloudUser(s.user)
      refreshAll()
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_ev, session)=>{
      if(session?.user && mounted) await buildCloudUser(session.user)
    })
    const ch = supabase.channel('ztc-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, ()=> refreshCloudOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, ()=> refreshCloudProducts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, ()=> refreshCloudProfiles())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ()=> refreshCloudMessages())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, ()=> refreshCloudMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, ()=> refreshTournaments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_regs' }, ()=> refreshRegs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, ()=> refreshTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_subs' }, ()=> refreshVipSubs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recharges' }, ()=> refreshRecharges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_join_requests' }, ()=> refreshJoinReqs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_assets' }, ()=>{ refreshTeamAssets(); refreshTeamInfos() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'xp_logs' }, ()=> refreshXp())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_claims' }, ()=> refreshXp())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, ()=> refreshNotifications())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lfg_posts' }, ()=> refreshLfg())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_reports' }, ()=> refreshMatchReports())
      .subscribe()
    let lastFocus = 0
    const onFocus = ()=>{ const now = Date.now(); if(now - lastFocus < 120000) return; lastFocus = now; refreshAll() }
    window.addEventListener('focus', onFocus)
    return ()=>{ mounted = false; sub.subscription.unsubscribe(); supabase.removeChannel(ch); window.removeEventListener('focus', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildCloudUser = async (sbUser)=>{
    try{
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', sbUser.id).single()
      const email = (sbUser.email||'').toLowerCase()
      const u = {
        id: sbUser.id, cloud: true,
        name: prof?.name || sbUser.user_metadata?.name || email.split('@')[0] || 'Client',
        email, provider: 'email', principal: 'sb-'+String(sbUser.id).slice(0,8),
        isAdmin: !!(prof?.is_admin || isOwnerEmail(email)),
        isVip: !!prof?.is_vip, vipUntil: prof?.vip_until || null,
        balance: Number(prof?.ztc_balance || 0),
        xp: Number(prof?.xp || 0),
        referredBy: prof?.referred_by || null,
        riot: prof?.riot_puuid ? {
          puuid: prof.riot_puuid,
          game: prof.riot_game || 'lol',
          region: prof.riot_region || 'euw',
          name: prof.riot_game_name || '',
          tag: prof.riot_tag_line || '',
        } : null,
        discord: prof?.discord_id ? { id: prof.discord_id, tag: prof.discord_tag || '' } : null,
        createdAt: prof?.created_at || new Date().toISOString(),
        ...readLocalExtras(sbUser.id),
      }
      sbUserId.current = sbUser.id
      setUser(u); saveProfile(u)
      return u
    }catch{
      const email = (sbUser.email||'').toLowerCase()
      const u = { id: sbUser.id, cloud: true, name: email.split('@')[0]||'Client', email, provider:'email', principal: 'sb-'+String(sbUser.id).slice(0,8), isAdmin: isOwnerEmail(email), createdAt: new Date().toISOString(), ...readLocalExtras(sbUser.id) }
      sbUserId.current = sbUser.id
      setUser(u); return u
    }
  }

  const upsertCloudProfile = async (sbUser, name)=>{
    try{
      const email = (sbUser.email||'').toLowerCase()
      // SECURITE : on n'envoie JAMAIS is_admin depuis l'appli.
      // Le rôle admin se donne uniquement via SQL Editor / service_role.
      const ref = sbUser.user_metadata?.ref
      const patch = { id: sbUser.id, email, name: name || sbUser.user_metadata?.name || email.split('@')[0], provider: 'email' }
      if(ref) patch.referred_by = ref
      await supabase.from('profiles').upsert(patch, { onConflict: 'id' })
    }catch{}
  }

  // ---- OAuth callback démo (Discord token direct, mode local) ----
  useEffect(()=>{
    const hash = window.location.hash
    if(hash.includes('access_token')){
      const params = new URLSearchParams(hash.slice(1))
      const token = params.get('access_token')
      const state = params.get('state')||''
      if(token){
        const provider = state.startsWith('discord') ? 'discord' : state.startsWith('facebook') ? 'facebook' : 'oauth'
        if(provider==='discord'){
          fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r=> r.ok? r.json(): null)
            .then(profile=>{
              const u = profile ? {
                id: 'discord_'+profile.id, name: profile.username, email: profile.email||'',
                avatar: profile.avatar? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`: '',
                provider:'discord', principal: genPrincipal(), createdAt: new Date().toISOString()
              } : {
                id: genId('discord'), name: 'Joueur Discord', email:'', provider:'discord', principal: genPrincipal(), createdAt: new Date().toISOString()
              }
              setUser(u); saveProfile(u)
              window.history.replaceState({}, '', window.location.pathname)
            })
            .catch(()=> window.history.replaceState({}, '', window.location.pathname))
        } else {
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [])

  // Legacy Internet Identity (local)
  const login = (asAdmin=false)=>{
    const u = { id: genId('ii'), name: asAdmin?'Admin':'Joueur', email:'', provider:'Internet Identity', principal: genPrincipal(), isAdmin: asAdmin, createdAt: new Date().toISOString() }
    setUser(withExtras(u)); saveProfile(withExtras(u)); return withExtras(u)
  }

  // ---- Email : cloud si configuré, sinon local ----
  const signupWithEmail = async (name, email, password)=>{
    email = email.trim().toLowerCase()
    if(!email || !password) throw new Error('Email et mot de passe requis')
    if(password.length<4) throw new Error('Mot de passe trop court (min 4)')
    if(cloud){
      let ref = null
      try{ ref = localStorage.getItem('ztc_ref') }catch{}
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name||email.split('@')[0], ...(ref ? { ref } : {}) } } })
      if(error) throw new Error(error.message)
      if(!data.session) throw new Error('Compte créé ! Vérifie ton email puis connecte-toi (ou désactive « Confirm email » dans Supabase > Auth).')
      await upsertCloudProfile(data.user, name)
      if(ref){
        try{ await supabase.rpc('claim_referral') }catch{}
        try{ localStorage.removeItem('ztc_ref') }catch{}
      }
      sendWelcomeEmail(name, email).catch(()=>{})
      return await buildCloudUser(data.user)
    }
    const users = readUsers()
    if(users.find(u=> u.email===email)) throw new Error('Ce email a déjà un compte — connecte-toi')
    const u = { id: genId('email'), name: name||email.split('@')[0], email, passwordHash: hashPw(password), provider:'email', principal: genPrincipal(), isAdmin: isOwnerEmail(email), createdAt: new Date().toISOString() }
    users.push(u); localStorage.setItem('ztc_users', JSON.stringify(users))
    const { passwordHash, ...safe } = u
    setUser(withExtras(safe))
    sendWelcomeEmail(safe.name, email).catch(()=>{})
    return withExtras(safe)
  }
  const loginWithEmail = async (email, password)=>{
    email = email.trim().toLowerCase()
    if(cloud){
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) throw new Error(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message)
      await upsertCloudProfile(data.user)
      const u = await buildCloudUser(data.user)
      refreshAll()
      return u
    }
    const users = readUsers()
    const found = users.find(u=> u.email===email)
    if(!found) throw new Error('Aucun compte avec cet email — crée un compte')
    if(found.passwordHash !== hashPw(password)) throw new Error('Mot de passe incorrect')
    const { passwordHash, ...safe } = found
    if(isOwnerEmail(email)) safe.isAdmin = true
    setUser(withExtras(safe)); saveProfile(withExtras(safe)); return withExtras(safe)
  }

  // ---- Mot de passe oublié (Supabase envoie le lien de réinitialisation) ----
  const sendPasswordReset = async (email)=>{
    email = (email||'').trim().toLowerCase()
    if(!email) throw new Error('Email requis')
    if(!cloud) throw new Error('Réinitialisation indisponible en mode hors-ligne')
    const redirectTo = window.location.origin + (import.meta.env.BASE_URL || '/') + 'reset-password'
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if(error) throw new Error(error.message)
    return true
  }
  const updatePassword = async (password)=>{
    if(!password || password.length < 6) throw new Error('Mot de passe trop court (min 6 caractères)')
    if(!cloud) throw new Error('Réinitialisation indisponible en mode hors-ligne')
    const { error } = await supabase.auth.updateUser({ password })
    if(error) throw new Error(error.message)
    return true
  }

  // ---- Discord / Facebook (démo locale ; commandes locales) ----
  const oauthRedirect = ()=> encodeURIComponent(window.location.origin + import.meta.env.BASE_URL + 'login')
  const loginWithDiscord = ()=>{
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID
    if(clientId){
      const redirect = oauthRedirect()
      const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=token&scope=identify%20email&state=discord_${Date.now()}`
      window.location.href = url
      return null
    }
    const u = { id: genId('discord'), name: 'Joueur Discord', email:'', provider:'discord', principal: genPrincipal(), createdAt: new Date().toISOString() }
    setUser(withExtras(u)); saveProfile(withExtras(u)); return withExtras(u)
  }
  const loginWithFacebook = ()=>{
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID
    if(appId){
      const redirect = oauthRedirect()
      const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&scope=email&response_type=token&state=facebook_${Date.now()}`
      window.location.href = url
      return null
    }
    const u = { id: genId('fb'), name: 'Joueur Facebook', email:'', provider:'facebook', principal: genPrincipal(), createdAt: new Date().toISOString() }
    setUser(withExtras(u)); saveProfile(withExtras(u)); return withExtras(u)
  }

  // ---- Admin propriétaire ----
  const loginAdmin = async (email, password)=>{
    email = (email||'').trim().toLowerCase()
    if(!cloud) throw new Error('Connexion admin indisponible : Supabase n’est pas configuré.')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) throw error
    if(!data.user) throw new Error('Connexion admin impossible.')

    await upsertCloudProfile(data.user)
    const u = await buildCloudUser(data.user)
    if(!u.isAdmin){
      await supabase.auth.signOut()
      throw new Error('Ce compte n’a pas les droits administrateur.')
    }

    refreshAll()
    return u
  }

  const logout = async ()=>{
    try{ if(cloud) await supabase.auth.signOut() }catch{}
    sbUserId.current = null
    setUser(null)
  }

  // ---- Profil membre : nom / téléphone / avatar / bannière / naissance / sexe ----
  const updateProfile = async ({ name, phone, avatar, banner, birthdate, gender })=>{
    if(!user) throw new Error('login')
    const next = { ...user }
    if(name!=null) next.name = String(name).slice(0, 60)
    if(phone!=null) next.phone = String(phone).slice(0, 30)
    if(avatar!==undefined) next.avatar = avatar
    if(banner!==undefined) next.banner = banner
    if(birthdate!==undefined) next.birthdate = birthdate
    if(gender!==undefined) next.gender = gender
    setUser(next)
    if(avatar!==undefined && avatar && avatar !== user.avatar) awardXp('avatar_update')
    writeExtrasById(user.id, { ...(next.avatar?{avatar:next.avatar}:{}), ...(next.banner?{banner:next.banner}:{}), ...(next.phone?{phone:next.phone}:{}), ...(next.birthdate?{birthdate:next.birthdate}:{}), ...(next.gender?{gender:next.gender}:{}) })
    // Partage cloud (photo+bannière visibles par tous) — best effort
    if(cloud && user.cloud){
      try{
        const { error } = await supabase.from('profile_assets').upsert(
          { id: user.id, name: next.name||'', avatar: next.avatar||null, banner: next.banner||null },
          { onConflict: 'id' })
        if(error) throw error
        setProfileAssets(prev=> ({ ...prev, [user.id]: { name: next.name||'', avatar: next.avatar||'', banner: next.banner||'' } }))
      }catch(e){ console.warn('cloud profile asset:', e.message) }
    }
    try{
      localStorage.setItem('ztc_user', JSON.stringify(next))
      const users = readUsers().map(u=> u.id===user.id ? { ...u, name: next.name||u.name, email: next.email||u.email } : u)
      localStorage.setItem('ztc_users', JSON.stringify(users))
    }catch(e){
      if(/quota|exceed/i.test(String(e?.message||e?.name||e))) throw new Error('quota')
    }
    return next
  }

  const saveMyGames = async (games)=>{
    if(!user) throw new Error('login')
    const selected = [...new Set((Array.isArray(games) ? games : []).filter(x=> typeof x === 'string'))]
    if(cloud && user.cloud){
      const { error } = await supabase.from('profile_assets').upsert({
        id: user.id,
        games: selected,
      }, { onConflict: 'id' })
      if(error) throw error
    }
    const next = { ...user, games: selected }
    setUser(next)
    writeExtrasById(user.id, { games: selected })
    try{ localStorage.setItem('ztc_user', JSON.stringify(next)) }
    catch(e){
      if(/quota|exceed/i.test(String(e?.message||e?.name||e))) throw new Error('quota')
    }
    setProfileAssets(prev=> ({
      ...prev,
      [user.id]: {
        ...(prev[user.id]||{}),
        ...(user.name ? { name: user.name } : {}),
        ...(user.avatar ? { avatar: user.avatar } : {}),
        ...(user.banner ? { banner: user.banner } : {}),
        games: selected,
      },
    }))
    return selected
  }

  // ---- Liaison Riot (LoL / Valorant) ----
  const linkRiot = async ({ game, region, name, tag })=>{
    if(!user) throw new Error('login')
    if(!(cloud && user.cloud)) throw new Error('cloud_only')
    const clean = String(name||'').trim()
    const tagClean = String(tag||'').trim().replace(/^#/, '')
    if(!clean || !tagClean) throw new Error('missing_riot_id')
    const info = await fetchRiotStats({ game, region, name: clean, tag: tagClean })
    const patch = {
      riot_puuid: info.puuid || null,
      riot_game_name: info.name || clean,
      riot_tag_line: info.tag || tagClean,
      riot_region: region,
      riot_game: game,
      riot_linked_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if(error) throw error
    const next = { ...user, riot: { puuid: patch.riot_puuid, game, region, name: patch.riot_game_name, tag: patch.riot_tag_line } }
    setUser(next); saveProfile(next)
    return info
  }
  const unlinkRiot = async ()=>{
    if(!user) throw new Error('login')
    if(cloud && user.cloud){
      const { error } = await supabase.from('profiles').update({
        riot_puuid: null, riot_game_name: null, riot_tag_line: null,
        riot_region: null, riot_game: null, riot_linked_at: null,
      }).eq('id', user.id)
      if(error) throw error
    }
    const next = { ...user, riot: null }
    setUser(next); saveProfile(next)
  }

  // ---- Liaison Discord (ID + rôle automatique si le bot est configuré) ----
  const linkDiscord = async ({ id, tag })=>{
    if(!user) throw new Error('login')
    if(!(cloud && user.cloud)) throw new Error('cloud_only')
    const clean = String(id || '').trim()
    if(!/^\d{15,25}$/.test(clean)) throw new Error('bad_discord_id')
    const patch = { discord_id: clean, discord_tag: String(tag || '').trim().slice(0, 60) || null }
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if(error){
      if(/discord_id|column/i.test(String(error.message||''))) throw new Error('need_sql')
      throw error
    }
    const next = { ...user, discord: { id: clean, tag: patch.discord_tag || '' } }
    setUser(next); saveProfile(next)
    syncDiscordRole(clean).catch(()=>{})
    return next.discord
  }
  const unlinkDiscord = async ()=>{
    if(!user) throw new Error('login')
    if(cloud && user.cloud){
      const { error } = await supabase.from('profiles').update({ discord_id: null, discord_tag: null }).eq('id', user.id)
      if(error) throw error
    }
    const next = { ...user, discord: null }
    setUser(next); saveProfile(next)
  }

  // ---- Suppressions admin (local + cloud) ----
  const deleteOrder = async (id)=>{
    if(!user?.isAdmin) throw new Error('login') // seul l'admin supprime
    const target = orders.find(o=> o.id===id)
    setOrders(prev=> prev.filter(o=> o.id!==id))
    // Rembourse un paiement wallet annulé avant confirmation
    if(target?.method==='wallet' && String(target.status||'').startsWith('En attente')){
      try{ await creditBalance(target.userId, Number(target.total||0), cloud && target.cloud) }catch{}
    }
    if(cloud && target?.cloud){
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if(error){ refreshCloudOrders(); throw new Error('del_need_policy') }
    }
  }
  const deleteAccount = async (id)=>{
    if(!user?.isAdmin) throw new Error('login') // seul l'admin supprime
    try{ localStorage.setItem('ztc_users', JSON.stringify(readUsers().filter(u=> u.id!==id))) }catch{}
    if(cloud){
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if(error){ refreshCloudProfiles(); throw new Error('del_need_policy') }
    }
  }

  // ---- Commandes : cloud si compte cloud, sinon local ----
  const addOrder = async (order)=>{
    const full = { ...order, cloud: !!(cloud && user?.cloud) }
    setOrders(prev=> [full, ...prev]) // optimiste : visible tout de suite
    if(full.cloud){
      try{
        await supabase.from('orders').insert({
          id: full.id, user_id: sbUserId.current || user.id,
          customer: { ...(full.customer||{}), provider: user.provider, principal: user.principal },
          items: full.items||[], total: full.total||0, method: full.method||'card', status: full.status,
        })
        refreshCloudOrders()
        refreshXp() // +1000 XP achat (trigger serveur)
      }catch(e){
        console.warn('cloud insert order:', e.message)
        setOrders(prev=> prev.map(x=> x.id===full.id ? {...x, syncError:true} : x))
      }
    }
    return full
  }
  // Réessaie l'envoi d'une commande restée locale (erreur réseau/RLS)
  const retryOrder = async (id)=>{
    const target = orders.find(o=> o.id===id)
    if(!target || !cloud || !user?.cloud) return false
    try{
      await supabase.from('orders').insert({
        id: target.id, user_id: sbUserId.current || user.id,
        customer: { ...(target.customer||{}), provider: user.provider, principal: user.principal },
        items: target.items||[], total: target.total||0, method: target.method||'card', status: target.status,
      })
      setOrders(prev=> prev.map(x=> x.id===id ? {...x, syncError:false} : x))
      refreshCloudOrders()
      return true
    }catch(e){
      if(String(e.message||'').includes('23505') || String(e.code||'')==='23505'){
        setOrders(prev=> prev.map(x=> x.id===id ? {...x, syncError:false} : x))
        refreshCloudOrders()
        return true
      }
      return false
    }
  }
  const updateOrderStatus = async (id, status)=>{
    const target = orders.find(o=> o.id===id)
    // Cashback wallet 3% : crédité UNE SEULE FOIS quand les codes sont débloqués.
    // (Pas à l'achat : sinon achat→annulation = coins gratuits.)
    if(target?.method==='wallet' && status.includes('Codes disponibles') && !target.customer?.cashback){
      const cb = Math.round(Number(target.total||0) * CASHBACK_RATE * 100) / 100
      if(cb > 0){
        try{ await creditBalance(target.userId, cb, cloud && target.cloud) }catch{}
        const flagged = {...target, status, customer: {...(target.customer||{}), cashback: cb}}
        setOrders(prev=> prev.map(x=> x.id===id ? flagged : x))
        if(cloud && target.cloud){
          try{ await supabase.from('orders').update({ status, customer: flagged.customer }).eq('id', id); refreshCloudOrders() }
          catch(e){ console.warn('cloud update order:', e.message) }
        }
        return
      }
    }
    setOrders(prev=> prev.map(x=> x.id===id? {...x, status}:x)) // optimiste
    if(cloud && target?.cloud){
      try{ await supabase.from('orders').update({ status }).eq('id', id); refreshCloudOrders() }
      catch(e){ console.warn('cloud update order:', e.message) }
    }
  }

  // ---- Tournois : CRUD admin + inscriptions ----
  const saveTournament = async (t)=>{
    // Un non-admin ne peut que PROPOSER (statut pending, validé par l'admin)
    const isNew = !t.id
    const prev = tournaments.find(x=> x.id===t.id) || null
    const forcedStatus = user?.isAdmin ? (t.status||'soon') : 'pending'
    const row = { ...t, id: t.id || ('trn-'+Date.now().toString(36)), status: forcedStatus, createdBy: t.createdBy || user?.id || null }
    setTournamentsState(prev=> {
      const i = prev.findIndex(x=> x.id===row.id)
      if(i>=0){ const c=[...prev]; c[i]=row; return c }
      return [row, ...prev]
    })
    if(cloud){
      try{
        const payload = {
          id: row.id, game: row.game, title: row.title, date: row.date || null,
          prize: row.prize||'', max_teams: Number(row.max_teams)||16, entry_fee: Number(row.entry_fee)||0,
          status: row.status, rules: row.rules||'', image: row.image||'',
          // Colonne video optionnelle : envoyée seulement si remplie (sinon les vieux tournois
          // continuent de se sauvegarder même avant la migration supabase-video.sql)
          ...(row.video ? { video: row.video } : {}),
          ...(row.elimination ? { elimination: row.elimination } : {}),
          ...(row.final_format ? { final_format: row.final_format } : {}),
          bracket: Array.isArray(row.bracket) ? row.bracket : [],
        }
        if(isNew) payload.created_by = sbUserId.current || (user?.cloud ? user?.id : null)
        try {
          const { error } = await supabase.from('tournaments').upsert(payload, { onConflict: 'id' })
          if(error) throw error
        } catch(err) {
          // Si colonnes elimination/final_format pas encore migrées en cloud, retry sans elles
          if(/elimination|final_format|column/i.test(String(err.message||''))){
            delete payload.elimination; delete payload.final_format
            const { error } = await supabase.from('tournaments').upsert(payload, { onConflict: 'id' })
            if(error) throw error
            console.warn('tournaments format columns missing in cloud — run supabase-tournaments-format.sql')
          } else throw err
        }
        refreshTournaments()
      }catch(e){
        console.warn('cloud save tournament:', e.message)
        if(/video|column/i.test(String(e.message||''))) throw new Error('need_sql_video')
        throw e
      }
    }
    // Annonces Discord (best effort, jamais bloquantes)
    try{
      const prevChamp = getChampion(prev?.bracket || [])
      const nextChamp = getChampion(row.bracket || [])
      if(!prev || (prev.status!=='open' && row.status==='open')) discordTournament(row).catch(()=>{})
      if(nextChamp && nextChamp !== prevChamp) discordChampion(row, nextChamp).catch(()=>{})
    }catch{}
    return row
  }
  const deleteTournament = async (id)=>{
    if(!user?.isAdmin) throw new Error('login') // seul l'admin supprime
    setTournamentsState(prev=> prev.filter(x=> x.id!==id))
    setRegs(prev=> prev.filter(x=> x.tournament_id!==id))
    if(cloud){
      try{
        const { error } = await supabase.from('tournaments').delete().eq('id', id)
        if(error) throw error
        refreshTournaments(); refreshRegs()
      }catch(e){ refreshTournaments(); throw new Error('del_need_policy') }
    }
  }
  const registerTournament = async ({ tournamentId, team, captain, phone, gameId, logo })=>{
    if(!user) throw new Error('login')
    if(!team?.trim()) throw new Error('team')
    const ph = (phone||'').replace(/[\s.-]/g,'')
    if(!/^[0-9+]{8,15}$/.test(ph)) throw new Error('phone')
    const reg = {
      id: genId('reg'), tournament_id: tournamentId, team: team.trim(),
      captain: (captain||'').trim(), phone: ph, game_id: (gameId||'').trim(),
      logo: (logo||'').slice(0, 200000),
      userId: user.cloud ? user.id : user.id, date: new Date().toISOString(),
      cloud: !!(cloud && user.cloud),
    }
    if(reg.cloud){
      const { data, error } = await supabase.from('tournament_regs').insert({
        tournament_id: tournamentId, team: reg.team, captain: reg.captain,
        phone: reg.phone, game_id: reg.game_id,
        ...(reg.logo ? { logo: reg.logo } : {}),
        user_id: sbUserId.current || user.id,
      }).select()
      if(error) throw error
      if(data?.[0]) { setRegs(prev=> [mapCloudReg(data[0]), ...prev]); refreshRegs(); awardXp('tournament_reg', tournamentId); return mapCloudReg(data[0]) }
    }
    setRegs(prev=> [reg, ...prev])
    awardXp('tournament_reg', tournamentId)
    return reg
  }
  const deleteReg = async (id)=>{
    if(!user?.isAdmin) throw new Error('login') // seul l'admin supprime
    const target = regs.find(x=> x.id===id)
    setRegs(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target?.cloud){
      const { error } = await supabase.from('tournament_regs').delete().eq('id', id)
      if(error){ refreshRegs(); throw new Error('del_need_policy') }
    }
  }
  // Ajout manuel d'équipe par l'admin (rejoint les inscrits dans le bracket)
  const addTeamManual = async (tournamentId, team, logo='')=>{
    const name = (team||'').trim()
    if(!name) throw new Error('team')
    const reg = {
      id: genId('reg'), tournament_id: tournamentId, team: name,
      captain: '', phone: '', game_id: '', logo: (logo||'').slice(0, 200000),
      userId: user?.id || null,
      date: new Date().toISOString(), cloud: !!(cloud && user?.cloud),
    }
    if(reg.cloud){
      try{
        const { data, error } = await supabase.from('tournament_regs').insert({
          tournament_id: tournamentId, team: name, captain: '', phone: '', game_id: '',
          ...(reg.logo ? { logo: reg.logo } : {}),
          user_id: sbUserId.current || user.id,
        }).select()
        if(error) throw error
        if(data?.[0]) { const m = mapCloudReg(data[0]); setRegs(prev=> [m, ...prev]); refreshRegs(); return m }
      }catch(e){
        // Table/RLS manquantes ou tournoi non synchronisé -> message précis (pas d'échec silencieux)
        const m = String(e.message || '')
        if(e.code==='42P01' || e.code==='PGRST205' || e.code==='42501' || e.code==='23503' || /tournament_regs|foreign key/i.test(m)) throw new Error('need_sql')
        throw e
      }
    }
    setRegs(prev=> [reg, ...prev])
    return reg
  }
  // Création d'équipe directement par le client (standalone, sans tournoi)
  const createTeam = async ({ name, game, logo, phone, description })=>{
    if(!user) throw new Error('login')
    const clean = (name||'').trim()
    if(clean.length < 2) throw new Error('team')
    const taken = [...regs.map(r=> r.team), ...teams.map(x=> x.name)]
      .some(n=> (n||'').toLowerCase()===clean.toLowerCase())
    if(taken) throw new Error('taken')
    const team = {
      id: genId('team'), name: clean, game: game||'valorant',
      logo: (logo||'').slice(0, 200000),
      captain: user.name || '', phone: (phone||'').replace(/[\s.-]/g,''),
      description: (description||'').trim().slice(0, 500),
      userId: user.id, date: new Date().toISOString(),
      cloud: !!(cloud && user.cloud),
    }
    if(team.cloud){
      try{
        const { data, error } = await supabase.from('teams').insert({
          id: team.id, name: team.name, game: team.game, logo: team.logo || null,
          captain: team.captain, phone: team.phone, description: team.description || null,
          user_id: sbUserId.current || user.id,
        }).select()
        if(error) throw error
        if(data?.[0]) { const m = mapCloudTeam(data[0]); setTeams(prev=> [m, ...prev]); refreshTeams(); awardXp('team_create'); return m }
      }catch(e){
        if(e.message==='taken') throw e
        if(e.code==='23505' || /duplicate/i.test(String(e.message || ''))) throw new Error('taken')
        // Table manquante ou RLS non configurée -> guider vers le SQL (pas d'échec silencieux)
        const m = String(e.message || '')
        if(e.code==='42P01' || e.code==='PGRST205' || e.code==='42501' || /teams/i.test(m)) throw new Error('need_sql')
        throw e
      }
    }
    setTeams(prev=> [team, ...prev])
    awardXp('team_create')
    return team
  }
  const deleteTeam = async (id)=>{
    if(!user?.isAdmin) throw new Error('login') // seul l'admin supprime (même le capitaine)
    const target = teams.find(x=> x.id===id)
    if(!target) return
    setTeams(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target.cloud){
      const { error } = await supabase.from('teams').delete().eq('id', id)
      if(error){ refreshTeams(); throw new Error('del_need_policy') }
    }
  }
  // Le capitaine modifie la description de SON équipe standalone (ou l'admin)
  const updateTeamInfo = async (id, { description })=>{
    const clean = (description||'').trim().slice(0, 500)
    const target = teams.find(x=> x.id===id)
    if(!target) throw new Error('team')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    setTeams(prev=> prev.map(x=> x.id===id ? {...x, description: clean} : x))
    if(cloud && target.cloud){
      try{
        const { error } = await supabase.from('teams').update({ description: clean || null }).eq('id', id)
        if(error) throw error
      }catch{ refreshTeams() }
      refreshTeams()
    }
    return clean
  }
  const saveTeamRoster = async (id, roster)=>{
    const target = teams.find(x=> x.id===id)
    if(!target) throw new Error('team')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    const clean = cleanRoster(roster, target.game)
    setTeams(prev=> prev.map(x=> x.id===id ? { ...x, roster: clean } : x))
    if(cloud && target.cloud){
      const { error } = await supabase.from('teams').update({ roster: clean }).eq('id', id)
      if(error){
        if(/roster/i.test(String(error.message||''))) throw new Error('need_sql')
        throw error
      }
      refreshTeams()
    }
    return clean
  }
  const updateTeamLogo = async (regId, logo)=>{
    const clean = (logo||'').slice(0, 200000)
    const target = regs.find(x=> x.id===regId)
    if(!target) throw new Error('team')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    setRegs(prev=> prev.map(x=> x.id===regId ? {...x, logo: clean} : x))
    if(cloud && target.cloud){
      try{
        const { error } = await supabase.from('tournament_regs').update({ logo: clean || null }).eq('id', regId)
        if(error) throw error
      }catch(e){
        if(String(e.message||'').includes('logo')) throw new Error('need_sql')
        throw e
      }
      refreshRegs()
    }
    return clean
  }
  const regsFor = (tid)=> regs.filter(x=> x.tournament_id===tid)
  // ---- Check-in équipe : le capitaine confirme que son équipe est prête ----
  const checkInTeam = async (regId, checked=true)=>{
    const target = regs.find(x=> x.id===regId)
    if(!target) throw new Error('team')
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    const firstCheckIn = checked && !target.checkedIn && !target.checkedInAt
    const checkedInAt = checked
      ? target.checkedInAt || new Date().toISOString()
      : target.checkedInAt || (target.checkedIn ? new Date().toISOString() : null)
    if(cloud && target.cloud){
      try{
        const { error } = await supabase.from('tournament_regs').update({ checked_in: checked, checked_in_at: checkedInAt }).eq('id', regId)
        if(error) throw error
      }catch(e){
        if(String(e.message||'').includes('checked_in')) throw new Error('need_sql')
        throw e
      }
    }
    setRegs(prev=> prev.map(x=> x.id===regId ? { ...x, checkedIn: checked, checkedInAt } : x))
    if(cloud && target.cloud) refreshRegs()
    if(firstCheckIn) awardXp('checkin', target.tournament_id)
    return true
  }
  const myRegs = (u=user)=>{
    if(!u) return []
    return regs.filter(x=> x.userId===u.id)
  }
  // ---- Équipes standalone de l'utilisateur (créées sur le site) ----
  const myTeams = (u=user)=>{
    if(!u) return []
    return teams.filter(x=> x.userId===u.id)
  }
  // ---- Inscription en 1 clic avec une équipe existante (sans formulaire) ----
  // Sécurité : seul le capitaine (propriétaire) peut inscrire SON équipe (admin excepté)
  const registerMyTeam = async ({ tournamentId, team })=>{
    if(!user) throw new Error('login')
    const own = myTeams().find(x=> x.id===team?.id)
    if(!user.isAdmin && !own) throw new Error('notowner')
    const src = own || teams.find(x=> x.id===team?.id)
    const name = (src?.name||'').trim()
    if(!name) throw new Error('team')
    if(regs.some(x=> x.tournament_id===tournamentId && (x.team||'').toLowerCase()===name.toLowerCase())) throw new Error('already')
    const rosterAvailable = src?.roster !== null && src?.roster !== undefined
    const roster = rosterAvailable ? cleanRoster(src?.roster, src?.game) : []
    const reg = {
      id: genId('reg'), tournament_id: tournamentId, team: name,
      captain: src.captain || user.name || '', phone: src.phone || '',
      game_id: src.game || '', logo: (src.logo||'').slice(0, 200000),
      roster,
      userId: user.isAdmin && !own ? (src.userId || user.id) : user.id,
      date: new Date().toISOString(),
      cloud: !!(cloud && user.cloud),
    }
    if(reg.cloud){
      const payload = {
        tournament_id: tournamentId, team: reg.team, captain: reg.captain,
        phone: reg.phone, game_id: reg.game_id,
        ...(reg.logo ? { logo: reg.logo } : {}),
        roster,
        user_id: sbUserId.current || user.id,
      }
      let res = await supabase.from('tournament_regs').insert(payload).select()
      if(res.error && /roster/i.test(String(res.error.message || ''))){
        const { roster: _roster, ...noRoster } = payload
        res = await supabase.from('tournament_regs').insert(noRoster).select()
      }
      const { data, error } = res
      if(error) throw error
      if(data?.[0]) {
        setRegs(prev=> [mapCloudReg(data[0]), ...prev]); refreshRegs(); awardXp('tournament_reg', tournamentId)
        const tr = tournaments.find(x=> x.id===tournamentId)
        if(tr) discordRegistration(tr, name).catch(()=>{})
        if(user.discord?.id) syncDiscordRole(user.discord.id).catch(()=>{})
        return mapCloudReg(data[0])
      }
    }
    setRegs(prev=> [reg, ...prev])
    awardXp('tournament_reg', tournamentId)
    const trLocal = tournaments.find(x=> x.id===tournamentId)
    if(trLocal) discordRegistration(trLocal, name).catch(()=>{})
    return reg
  }
  // ---- Demandes pour rejoindre une équipe (player avec compte) ----
  const joinReqsFor = (regId)=> joinReqs.filter(x=> x.regId===regId)
  const myJoinReqs = (u=user)=>{
    if(!u) return []
    return joinReqs.filter(x=> x.userId===u.id)
  }
  const requestJoinTeam = async ({ regId, tournamentId, message })=>{
    if(!user) throw new Error('login')
    if(regs.some(x=> x.id===regId && x.userId===user.id)) throw new Error('ownteam')
    const existing = joinReqs.find(x=> x.regId===regId && x.userId===user.id)
    if(existing && existing.status!=='rejected') throw new Error('already')
    // Nom affichable : évite "Joueur" générique — préfère le préfixe email
    let display = (user.name||'').trim()
    if(!display || /^(joueur|player|client|user)$/i.test(display)){
      display = (user.email||'').includes('@') ? user.email.split('@')[0] : ''
    }
    const req = {
      id: existing?.id || genId('join'), tournament_id: tournamentId, regId,
      userId: user.id, userName: display || user.name || 'Joueur',
      userEmail: user.email||'', principal: user.principal||'',
      message: (message||'').slice(0, 300), status: 'pending',
      date: new Date().toISOString(), cloud: !!(cloud && user.cloud),
    }
    // Réessai après refus : on réactive la demande existante (unique(reg_id,user_id) l'interdit)
    if(existing){
      setJoinReqs(prev=> prev.map(x=> x.id===existing.id ? { ...x, ...req, id: existing.id } : x))
      if(cloud){
        try{
          const { error } = await supabase.from('tournament_join_requests').update({ status: 'pending', message: req.message, user_name: req.userName, user_email: req.userEmail }).eq('id', existing.id)
          if(error && !String(error.message||'').includes('user_name')){
            await supabase.from('tournament_join_requests').update({ status: 'pending', message: req.message }).eq('id', existing.id)
          }
        }catch{
          try{ await supabase.from('tournament_join_requests').update({ status: 'pending', message: req.message }).eq('id', existing.id) }catch{}
        }
        refreshJoinReqs()
      }
      return { ...req, id: existing.id }
    }
    if(req.cloud){
      try{
        let payload = { tournament_id: tournamentId, reg_id: regId, user_id: sbUserId.current || user.id, message: req.message, status: 'pending' }
        let data, error
        try{
          ({ data, error } = await supabase.from('tournament_join_requests').insert({ ...payload, user_name: req.userName, user_email: req.userEmail }).select())
          if(error && !String(error.message||'').includes('user_name')) throw error
          if(error){ ({ data, error } = await supabase.from('tournament_join_requests').insert(payload).select()) }
        }catch(err2){
          if(err2 && !String(err2.message||'').includes('user_name')) throw err2
          ;({ data, error } = await supabase.from('tournament_join_requests').insert(payload).select())
        }
        if(error) throw error
        if(data?.[0]) { const m = mapCloudJoin(data[0]); setJoinReqs(prev=> [m, ...prev]); refreshJoinReqs(); return m }
      }catch(e){
        if(String(e.message||'').includes('tournament_join_requests')) throw new Error('need_sql')
        throw e
      }
    }
    setJoinReqs(prev=> [req, ...prev])
    return req
  }
  const updateJoinReq = async (id, status)=>{
    setJoinReqs(prev=> prev.map(x=> x.id===id ? {...x, status} : x))
    if(cloud){
      try{ await supabase.from('tournament_join_requests').update({ status }).eq('id', id) }catch{}
      refreshJoinReqs()
    }
  }

  // ---- Produits : écriture cloud (remplacement table, admin) ou locale ----
  const setProducts = (next)=>{
    setProductsState(next)
  }
  const saveProducts = async (next)=>{
    setProductsState(next)
    if(!cloud) return
    try{
      const rows = next.map(toCloudProduct)
      const ids = rows.map(r=>r.id)
      await supabase.from('products').delete().in('id', ids)
      const { error } = await supabase.from('products').insert(rows)
      if(error) throw error
      refreshCloudProducts()
    }catch(e){ console.warn('cloud save products:', e.message); throw e }
  }

  const myOrders = (u=user)=>{
    if(!u) return []
    return orders.filter(o=> o.userId===u.id || o.principal===u.principal || (u.email && o.customer?.email?.toLowerCase()===u.email.toLowerCase()))
  }

  // ---- Chat direct admin <-> client ----
  const sendMessage = async ({ text, orderId=null, toUserId=null })=>{
    const clean = (text||'').trim()
    if(!clean || !user) throw new Error('empty')
    const isAdminMsg = !!user.isAdmin
    // Côté admin : le fil appartient au client (toUserId). Côté client : son propre fil.
    const threadUserId = isAdminMsg ? (toUserId || user.id) : (user.cloud ? user.id : (user.id))
    // Si l'admin écrit à un compte précis : affiche le nom du destinataire dans le fil
    // (sinon le thread tout neuf apparaîtrait au nom de l'admin)
    const targetName = (isAdminMsg && toUserId) ? allAccounts().find(a=> a.id===toUserId)?.name : null
    const msg = {
      id: genId('msg'), userId: threadUserId, orderId,
      sender: isAdminMsg ? 'admin' : 'client',
      name: targetName || user.name || user.email || 'Client',
      // Images (data URL ou URL Storage) gardées entières, textes limités à 1000
      text: isImageValue(clean) ? clean : clean.slice(0, 1000), isRead: false,
      date: new Date().toISOString(), cloud: !!(cloud && (user.cloud || isAdminMsg)),
    }
    setMessages(prev=> [...prev, msg])
    if(msg.cloud){
      try{
        const { error } = await supabase.from('messages').insert({
          user_id: threadUserId, order_id: orderId,
          sender: msg.sender, name: msg.name, text: msg.text,
        })
        if(error) throw error
        refreshCloudMessages()
        // Notification push système (best effort : ne bloque jamais l'envoi)
        try{
          const preview = isImageValue(clean) ? '📷 Photo' : clean.slice(0, 120)
          supabase.functions.invoke('push-message', {
            body: isAdminMsg
              ? { senderId: user.cloud ? user.id : null, senderName: user.name || 'ZTC Shop', text: preview, targetUserId: threadUserId }
              : { senderId: user.cloud ? user.id : null, senderName: msg.name, text: preview, toAdmins: true },
          }).catch(()=>{})
        }catch{}
      }catch(e){
        console.warn('cloud send message:', e.message)
        // Échec cloud (RLS/réseau) : garde une copie locale persistée au lieu de la perdre au reload
        setMessages(prev=> prev.map(m=> m.id===msg.id ? {...m, cloud: false} : m))
      }
    }
    return msg
  }
  const markThreadRead = async (threadUserId)=>{
    setMessages(prev=> prev.map(m=> (m.userId===threadUserId && m.sender==='client') ? {...m, isRead:true} : m))
    if(cloud){
      try{ await supabase.from('messages').update({ is_read: true }).eq('user_id', threadUserId).eq('sender', 'client') }catch{}
    }
  }
  // Fil d'un client (ses messages + réponses admin)
  const myThread = (u=user)=>{
    if(!u) return []
    return messages.filter(m=> m.userId===u.id || (!m.userId && m.sender==='client')).sort((a,b)=> new Date(a.date||0)-new Date(b.date||0))
  }
  // Threads groupés pour l'admin : [{userId, name, last, unread, count}]
  const adminThreads = ()=>{
    const map = new Map()
    messages.forEach(m=>{
      const key = m.userId || 'unknown'
      if(!map.has(key)) map.set(key, { userId: key, name: m.name||'Client', last: null, unread: 0, count: 0 })
      const t = map.get(key)
      t.count += 1
      if(!t.last || new Date(m.date||0) > new Date(t.last.date||0)) t.last = m
      if(m.sender==='client' && !m.isRead) t.unread += 1
      if(m.sender==='client' && m.name) t.name = m.name
    })
    return [...map.values()].sort((a,b)=> new Date(b.last?.date||0) - new Date(a.last?.date||0))
  }

  // Tous les comptes : registre local + profils cloud + clients vus via commandes
  const allAccounts = ()=>{
    const map = new Map()
    readUsers().forEach(r=> map.set(r.id, { ...r, phones: [], ordersCount: 0, totalSpent: 0, lastOrder: null, orderIds: [] }))
    ;(cloudProfiles||[]).forEach(p=>{
      if(!map.has(p.id)) map.set(p.id, { id: p.id, name: p.name||'', email: p.email||'', provider: p.provider||'email', principal: '', isAdmin: !!p.is_admin, cloud: true, xp: Number(p.xp||0), createdAt: p.created_at, lastSeen: p.created_at, phones: [], ordersCount: 0, totalSpent: 0, lastOrder: null, orderIds: [] })
      else { const a = map.get(p.id); a.isAdmin = a.isAdmin || !!p.is_admin; a.cloud = true; a.xp = Number(p.xp||0); if(p.name) a.name = p.name; if(p.email) a.email = p.email }
    })
    // Photos/bannières profils cloud (partagées) : donnent aussi le nom public
    Object.entries(profileAssets||{}).forEach(([pid, a])=>{
      const generic = !a?.name || /^(joueur|player|client|user)$/i.test(a.name)
      if(!map.has(pid)) map.set(pid, { id: pid, name: generic?'':a.name, email: '', provider: 'email', principal: '', isAdmin: false, createdAt: null, lastSeen: null, phones: [], ordersCount: 0, totalSpent: 0, lastOrder: null, orderIds: [] })
      else if(!generic){ const acc = map.get(pid); if(!acc.name || /^(joueur|player|client|user)$/i.test(acc.name)) acc.name = a.name }
    })
    orders.forEach(o=>{
      const key = o.userId || o.principal || o.customer?.email || o.id
      if(!map.has(key)){
        map.set(key, {
          id: key, name: o.customer?.name||'Client', email: o.customer?.email||'',
          provider: o.provider||'email', principal: o.principal||'', isAdmin: false,
          createdAt: o.date, lastSeen: o.date, phones: [], ordersCount: 0, totalSpent: 0, lastOrder: null, orderIds: []
        })
      }
      const a = map.get(key)
      if(o.customer?.phone && !a.phones.includes(o.customer.phone)) a.phones.push(o.customer.phone)
      if(o.customer?.email && !a.email) a.email = o.customer.email
      if(o.customer?.name && (a.name==='Client'||!a.name)) a.name = o.customer.name
      a.ordersCount += 1
      a.totalSpent += Number(o.total||0)
      if(!a.lastOrder || new Date(o.date) > new Date(a.lastOrder)) a.lastOrder = o.date
      a.orderIds.push(o.id)
    })
    return [...map.values()].sort((a,b)=> new Date(b.lastSeen||b.createdAt||0) - new Date(a.lastSeen||a.createdAt||0))
  }

  // L'admin a-t-il la vue globale cloud ? (false tant que le SQL is_admin n'est pas exécuté)
  const needsDbGrant = cloud && !!user?.isAdmin && cloudProfiles === null

  return <AuthCtx.Provider value={{user, setUser, cloud, needsDbGrant, refreshAll, refreshMessages: refreshCloudMessages, login, loginAdmin, loginWithEmail, signupWithEmail, sendPasswordReset, updatePassword, loginWithDiscord, loginWithFacebook, logout, orders, myOrders, allAccounts, addOrder, retryOrder, updateOrderStatus, deleteOrder, deleteAccount, messages, sendMessage, markThreadRead, myThread, adminThreads, tournaments, regs, saveTournament, deleteTournament, registerTournament,
    deleteReg, regsFor, myRegs, myTeams, registerMyTeam, addTeamManual, updateTeamLogo, updateTeamInfo, saveTeamRoster, checkInTeam, teams, createTeam, deleteTeam, updateProfile, saveMyGames, teamAssets, saveTeamAsset, teamInfos, saveTeamExtras, profileAssets, refreshProfileAssets, VIP_PRICE, VIP_DISCOUNT, isVipActive, vipSubs, myVipSub, createVipSub, confirmVipSub, rejectVipSub, COIN_RATE, CASHBACK_RATE, recharges, myRecharges, createRecharge, confirmRecharge, rejectRecharge, refreshMyBalance, creditBalance, spendBalance, joinReqs, joinReqsFor, myJoinReqs, requestJoinTeam, updateJoinReq, products, setProducts, saveProducts,
    xpLogs, rewardClaims, xpOf, awardXp, claimReward, decideReward, inviteLink, refreshXp, linkRiot, unlinkRiot, linkDiscord, unlinkDiscord, notifications, notifReady, unreadNotifications, refreshNotifications, markNotifRead, markAllNotifsRead, badges, dailyClaims, progressReady, refreshProgress, dailyCheckin, claimMission,
    lfgPosts, refreshLfg, createLfgPost, closeLfgPost, deleteLfgPost, matchReports, refreshMatchReports, submitMatchReport, decideMatchReport, deleteMatchReport}}>{children}</AuthCtx.Provider>
}
export const useAuth = ()=> useContext(AuthCtx)
