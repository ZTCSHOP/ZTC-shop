import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { initialProducts } from '../data/products'
import { supabase, isCloudEnabled } from '../lib/supabase'

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
    const entry = { id: u.id, name: u.name||'', email: u.email||'', provider: u.provider||'email', principal: u.principal||'', isAdmin: !!u.isAdmin || isOwnerEmail(u.email), createdAt: u.createdAt||new Date().toISOString(), lastSeen: new Date().toISOString() }
    if(idx>=0){
      const keepHash = users[idx].passwordHash
      users[idx] = { ...entry, createdAt: users[idx].createdAt||entry.createdAt, ...(keepHash?{passwordHash: keepHash}:{}) }
      if(u.name) users[idx].name = u.name
      if(u.email) users[idx].email = u.email
    } else users.push(entry)
    localStorage.setItem('ztc_users', JSON.stringify(users))
  }catch{}
}

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

  useEffect(()=> localStorage.setItem('ztc_user', JSON.stringify(user)), [user])
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
      const { data, error } = await supabase.from('profiles').select('*').limit(500)
      if(error) throw error
      setCloudProfiles(data||[])
    }catch{ setCloudProfiles(null) }
  }, [])

  const [messages, setMessages] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_messages')||'[]')}catch{return []}
  })
  useEffect(()=> localStorage.setItem('ztc_messages', JSON.stringify(messages.filter(m=>!m.cloud))), [messages])

  // ---- Tournois ----
  const seedTournaments = [
    { id:'val-cup-1', game:'valorant', title:'Valorant Clash Cup #1', date: new Date(Date.now()+9*864e5).toISOString(), prize:'1000 TND + 5000 VP', max_teams:16, entry_fee:10, status:'open', rules:'5v5 • Maps : Ascent, Bind, Haven • Demi-finales BO3, finale BO5. Check-in Discord 30 min avant.', image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7raq6TZniTT-h3tAcCp4gTt1qayp_6_4m5VYdEKZf2w&s=10' },
    { id:'lol-clash-1', game:'lol', title:'LoL Tunisian Showdown', date: new Date(Date.now()+23*864e5).toISOString(), prize:'2000 TND cash prize', max_teams:32, entry_fee:0, status:'soon', rules:'5v5 Summoners Rift • Tournoi à élimination directe.', image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10' },
  ]
  const [tournaments, setTournamentsState] = useState(()=>{
    try{ const s = JSON.parse(localStorage.getItem('ztc_tournaments')||'null'); return Array.isArray(s) && s.length ? s : seedTournaments }catch{ return seedTournaments }
  })
  const [regs, setRegs] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_regs')||'[]')}catch{return []}
  })
  // ---- Équipes créées directement par les clients (standalone) ----
  const [teams, setTeams] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_teams')||'[]')}catch{return []}
  })
  const [joinReqs, setJoinReqs] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('ztc_join_reqs')||'[]')}catch{return []}
  })
  useEffect(()=> localStorage.setItem('ztc_tournaments', JSON.stringify(tournaments.filter(x=>!x.cloud))), [tournaments])
  useEffect(()=> localStorage.setItem('ztc_regs', JSON.stringify(regs.filter(x=>!x.cloud))), [regs])
useEffect(()=> localStorage.setItem('ztc_teams', JSON.stringify(teams.filter(x=>!x.cloud))), [teams])
  useEffect(()=> localStorage.setItem('ztc_join_reqs', JSON.stringify(joinReqs.filter(x=>!x.cloud))), [joinReqs])

  const mapCloudTournament = (r)=> ({ id: r.id, game: r.game, title: r.title, date: r.date, prize: r.prize||'', max_teams: r.max_teams??16, entry_fee: Number(r.entry_fee||0), status: r.status||'soon', rules: r.rules||'', image: r.image||'', createdBy: r.created_by||null, bracket: Array.isArray(r.bracket) ? r.bracket : [], cloud: true })
  const mapCloudReg = (r)=> ({ id: r.id, tournament_id: r.tournament_id, team: r.team, captain: r.captain||'', phone: r.phone||'', game_id: r.game_id||'', logo: r.logo||'', userId: r.user_id, date: r.created_at, cloud: true })
  const mapCloudJoin = (r)=> ({ id: r.id, tournament_id: r.tournament_id, regId: r.reg_id, userId: r.user_id, message: r.message||'', status: r.status||'pending', date: r.created_at, cloud: true })
  const mapCloudTeam = (r)=> ({ id: r.id, name: r.name, game: r.game||'valorant', logo: r.logo||'', captain: r.captain||'', phone: r.phone||'', description: r.description||'', userId: r.user_id, date: r.created_at, cloud: true })

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
          return [...map.values()]
        })
      }
    }catch(e){ console.warn('cloud tournaments:', e.message) }
  }, [])
  const refreshRegs = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('tournament_regs').select('*').order('created_at', { ascending: false }).limit(500)
      if(error) throw error
      const mapped = (data||[]).map(mapCloudReg)
      setRegs(prev=>{
        const map = new Map()
        prev.forEach(x=> map.set(x.id, x))
        mapped.forEach(x=> map.set(x.id, x))
        return [...map.values()]
      })
    }catch(e){ console.warn('cloud regs:', e.message) }
  }, [])
  const refreshTeams = useCallback(async ()=>{
    if(!cloud) return
    try{
      const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false }).limit(500)
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
  const refreshJoinReqs = useCallback(async ()=>{    if(!cloud) return
    try{
      const { data, error } = await supabase.from('tournament_join_requests').select('*').order('created_at', { ascending: false }).limit(500)
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
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(500)
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

  const refreshAll = useCallback(()=>{
    refreshCloudOrders(); refreshCloudProducts(); refreshCloudProfiles(); refreshCloudMessages(); refreshTournaments(); refreshRegs(); refreshJoinReqs(); refreshTeams()
  }, [refreshCloudOrders, refreshCloudProducts, refreshCloudProfiles, refreshCloudMessages, refreshTournaments, refreshRegs, refreshJoinReqs, refreshTeams])

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_join_requests' }, ()=> refreshJoinReqs())
      .subscribe()
    const onFocus = ()=> refreshAll()
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
        createdAt: prof?.created_at || new Date().toISOString(),
      }
      sbUserId.current = sbUser.id
      setUser(u); saveProfile(u)
      return u
    }catch{
      const email = (sbUser.email||'').toLowerCase()
      const u = { id: sbUser.id, cloud: true, name: email.split('@')[0]||'Client', email, provider:'email', principal: 'sb-'+String(sbUser.id).slice(0,8), isAdmin: isOwnerEmail(email), createdAt: new Date().toISOString() }
      sbUserId.current = sbUser.id
      setUser(u); return u
    }
  }

  const upsertCloudProfile = async (sbUser, name)=>{
    try{
      const email = (sbUser.email||'').toLowerCase()
      // SECURITE : on n'envoie JAMAIS is_admin depuis l'appli.
      // Le rôle admin se donne uniquement via SQL Editor / service_role.
      await supabase.from('profiles').upsert(
        { id: sbUser.id, email, name: name || sbUser.user_metadata?.name || email.split('@')[0], provider: 'email' },
        { onConflict: 'id' }
      )
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
    setUser(u); saveProfile(u); return u
  }

  // ---- Email : cloud si configuré, sinon local ----
  const signupWithEmail = async (name, email, password)=>{
    email = email.trim().toLowerCase()
    if(!email || !password) throw new Error('Email et mot de passe requis')
    if(password.length<4) throw new Error('Mot de passe trop court (min 4)')
    if(cloud){
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name||email.split('@')[0] } } })
      if(error) throw new Error(error.message)
      if(!data.session) throw new Error('Compte créé ! Vérifie ton email puis connecte-toi (ou désactive « Confirm email » dans Supabase > Auth).')
      await upsertCloudProfile(data.user, name)
      return await buildCloudUser(data.user)
    }
    const users = readUsers()
    if(users.find(u=> u.email===email)) throw new Error('Ce email a déjà un compte — connecte-toi')
    const u = { id: genId('email'), name: name||email.split('@')[0], email, passwordHash: hashPw(password), provider:'email', principal: genPrincipal(), isAdmin: isOwnerEmail(email), createdAt: new Date().toISOString() }
    users.push(u); localStorage.setItem('ztc_users', JSON.stringify(users))
    const { passwordHash, ...safe } = u
    setUser(safe); return safe
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
    setUser(safe); saveProfile(safe); return safe
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
    setUser(u); saveProfile(u); return u
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
    setUser(u); saveProfile(u); return u
  }

  // ---- Admin propriétaire ----
  // Tente d'abord une session cloud (nécessaire pour écrire dans le cloud),
  // sinon repli local.
  const loginAdmin = async (email, password)=>{
    email = (email||'').trim().toLowerCase()
    if(cloud){
      try{
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if(!error && data.user){
          await upsertCloudProfile(data.user)
          const u = await buildCloudUser(data.user)
          refreshAll()
          if(u.isAdmin) return u
        }
      }catch{}
    }
    const expectedEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@ztc.shop').toLowerCase()
    const expectedPass = import.meta.env.VITE_ADMIN_PASSWORD || 'ztc2026admin'
    if(email === expectedEmail && password === expectedPass){
      const u = { id: 'admin_owner', name: 'Admin ZTC', email, provider:'email', principal: genPrincipal(), isAdmin: true, createdAt: new Date().toISOString() }
      setUser(u); saveProfile(u); return u
    }
    const users = readUsers()
    const found = users.find(u=> u.email===email)
    if(found && found.passwordHash === hashPw(password) && (isOwnerEmail(email) || found.isAdmin)){
      const { passwordHash, ...safe } = found
      safe.isAdmin = true
      setUser(safe); saveProfile(safe); return safe
    }
    if(email !== expectedEmail && !found) throw new Error('Email admin inconnu')
    throw new Error('Mot de passe admin incorrect')
  }

  const logout = async ()=>{
    try{ if(cloud) await supabase.auth.signOut() }catch{}
    sbUserId.current = null
    setUser(null)
  }

  // ---- Suppressions admin (local + cloud) ----
  const deleteOrder = async (id)=>{
    const target = orders.find(o=> o.id===id)
    setOrders(prev=> prev.filter(o=> o.id!==id))
    if(cloud && target?.cloud){
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if(error){ refreshCloudOrders(); throw new Error('del_need_policy') }
    }
  }
  const deleteAccount = async (id)=>{
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
    setOrders(prev=> prev.map(x=> x.id===id? {...x, status}:x)) // optimiste
    const target = orders.find(o=> o.id===id)
    if(cloud && target?.cloud){
      try{ await supabase.from('orders').update({ status }).eq('id', id); refreshCloudOrders() }
      catch(e){ console.warn('cloud update order:', e.message) }
    }
  }

  // ---- Tournois : CRUD admin + inscriptions ----
  const saveTournament = async (t)=>{
    // Un non-admin ne peut que PROPOSER (statut pending, validé par l'admin)
    const isNew = !t.id
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
          bracket: Array.isArray(row.bracket) ? row.bracket : [],
        }
        if(isNew) payload.created_by = sbUserId.current || (user?.cloud ? user?.id : null)
        const { error } = await supabase.from('tournaments').upsert(payload, { onConflict: 'id' })
        if(error) throw error
        refreshTournaments()
      }catch(e){ console.warn('cloud save tournament:', e.message); throw e }
    }
    return row
  }
  const deleteTournament = async (id)=>{
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
        phone: reg.phone, game_id: reg.game_id, logo: reg.logo || null,
        user_id: sbUserId.current || user.id,
      }).select()
      if(error) throw error
      if(data?.[0]) { setRegs(prev=> [mapCloudReg(data[0]), ...prev]); refreshRegs(); return mapCloudReg(data[0]) }
    }
    setRegs(prev=> [reg, ...prev])
    return reg
  }
  const deleteReg = async (id)=>{
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
      const { data, error } = await supabase.from('tournament_regs').insert({
        tournament_id: tournamentId, team: name, captain: '', phone: '', game_id: '',
        logo: reg.logo || null,
        user_id: sbUserId.current || user.id,
      }).select()
      if(error) throw error
      if(data?.[0]) { const m = mapCloudReg(data[0]); setRegs(prev=> [m, ...prev]); refreshRegs(); return m }
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
      const { data, error } = await supabase.from('teams').insert({
        id: team.id, name: team.name, game: team.game, logo: team.logo || null,
        captain: team.captain, phone: team.phone, description: team.description || null,
        user_id: sbUserId.current || user.id,
      }).select()
      if(error){
        if(String(error.message||'').includes('duplicate') || error.code==='23505') throw new Error('taken')
        throw error
      }
      if(data?.[0]) { const m = mapCloudTeam(data[0]); setTeams(prev=> [m, ...prev]); refreshTeams(); return m }
    }
    setTeams(prev=> [team, ...prev])
    return team
  }
  const deleteTeam = async (id)=>{
    const target = teams.find(x=> x.id===id)
    if(!target) return
    if(!user || (!user.isAdmin && target.userId!==user.id)) throw new Error('login')
    setTeams(prev=> prev.filter(x=> x.id!==id))
    if(cloud && target.cloud){
      const { error } = await supabase.from('teams').delete().eq('id', id)
      if(error){ refreshTeams(); throw new Error('del_need_policy') }
    }
  }
  // Le capitaine change le logo de SON équipe (ou l'admin)
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
  const myRegs = (u=user)=>{
    if(!u) return []
    return regs.filter(x=> x.userId===u.id)
  }
  // ---- Demandes pour rejoindre une équipe (player avec compte) ----
  const joinReqsFor = (regId)=> joinReqs.filter(x=> x.regId===regId)
  const myJoinReqs = (u=user)=>{
    if(!u) return []
    return joinReqs.filter(x=> x.userId===u.id)
  }
  const requestJoinTeam = async ({ regId, tournamentId, message })=>{
    if(!user) throw new Error('login')
    if(joinReqs.some(x=> x.regId===regId && x.userId===user.id)) throw new Error('already')
    if(regs.some(x=> x.id===regId && x.userId===user.id)) throw new Error('ownteam')
    const req = {
      id: genId('join'), tournament_id: tournamentId, regId,
      userId: user.id, userName: user.name||user.email||'Joueur',
      message: (message||'').slice(0, 300), status: 'pending',
      date: new Date().toISOString(), cloud: !!(cloud && user.cloud),
    }
    if(req.cloud){
      try{
        const { data, error } = await supabase.from('tournament_join_requests').insert({
          tournament_id: tournamentId, reg_id: regId,
          user_id: sbUserId.current || user.id,
          message: req.message, status: 'pending',
        }).select()
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
    const msg = {
      id: genId('msg'), userId: threadUserId, orderId,
      sender: isAdminMsg ? 'admin' : 'client',
      name: user.name || user.email || 'Client',
      // Images (data URL) gardées entières, textes limités à 1000
      text: clean.startsWith('data:image') ? clean : clean.slice(0, 1000), isRead: false,
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
      }catch(e){ console.warn('cloud send message:', e.message) }
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
      if(!map.has(p.id)) map.set(p.id, { id: p.id, name: p.name||'', email: p.email||'', provider: p.provider||'email', principal: '', isAdmin: !!p.is_admin, createdAt: p.created_at, lastSeen: p.created_at, phones: [], ordersCount: 0, totalSpent: 0, lastOrder: null, orderIds: [] })
      else { const a = map.get(p.id); a.isAdmin = a.isAdmin || !!p.is_admin; if(p.name) a.name = p.name; if(p.email) a.email = p.email }
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

  return <AuthCtx.Provider value={{user, setUser, cloud, needsDbGrant, refreshAll, login, loginAdmin, loginWithEmail, signupWithEmail, loginWithDiscord, loginWithFacebook, logout, orders, myOrders, allAccounts, addOrder, retryOrder, updateOrderStatus, deleteOrder, deleteAccount, messages, sendMessage, markThreadRead, myThread, adminThreads, tournaments, regs, saveTournament, deleteTournament, registerTournament,
    deleteReg, regsFor, myRegs, addTeamManual, updateTeamLogo, teams, createTeam, deleteTeam, joinReqs, joinReqsFor, myJoinReqs, requestJoinTeam, updateJoinReq, products, setProducts, saveProducts}}>{children}</AuthCtx.Provider>
}
export const useAuth = ()=> useContext(AuthCtx)
