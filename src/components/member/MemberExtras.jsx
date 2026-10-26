import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Crown, Gift, Package, Shield, Trophy, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getPrefs, notifAllowed, savePrefs, PREF_ITEMS } from '../../lib/prefs'
import { supabase } from '../../lib/supabase'
import { useLang, LANGS } from '../../context/LanguageContext'
import { timeAgo } from '../NotificationBell'

const ICONS = { order:Package, tournament:Trophy, reward:Gift, wallet:Wallet, vip:Crown, team:Shield, support:Bell, info:Bell }
const COLORS = {
  order:'text-sky-300 bg-sky-500/15 border-sky-400/30',
  tournament:'text-amber-300 bg-amber-400/15 border-amber-400/30',
  reward:'text-pink-300 bg-pink-500/15 border-pink-400/30',
  wallet:'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
  vip:'text-yellow-300 bg-yellow-500/15 border-yellow-400/30',
  team:'text-violet-300 bg-violet-500/15 border-violet-400/30',
}
const FILTERS = [{ id:'all', label:'Tout' }, ...PREF_ITEMS.map(i=>({ id:i.type, label:i.label }))]

export function NotificationList(){
  const { notifications, notifReady, markNotifRead, markAllNotifsRead, refreshNotifications, unreadNotifications } = useAuth()
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
  const [prefs, setPrefs] = useState(()=> getPrefs())

  useEffect(()=>{ refreshNotifications() }, [])
  useEffect(()=>{
    const h = ()=> setPrefs(getPrefs())
    window.addEventListener('ztc:prefs', h)
    return ()=> window.removeEventListener('ztc:prefs', h)
  }, [])

  const list = useMemo(()=>{
    return (notifications || [])
      .filter(n=> notifAllowed(n.type, prefs))
      .filter(n=> filter==='all' ? true : n.type===filter)
  }, [notifications, filter, prefs])

  return (
    <div className="grid gap-4">
      {!notifReady && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-[13px] text-amber-200 leading-relaxed">
          ⚠️ Le centre de notifications n'est pas encore activé. Exécute <b>notifications-sql.txt</b> dans Supabase (SQL Editor), puis recharge la page.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${filter===f.id ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            {f.label}
          </button>
        ))}
        {unreadNotifications>0 && (
          <button onClick={markAllNotifsRead} className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10">
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {list.length===0 && (
          <div className="p-10 text-center">
            <Bell size={28} className="mx-auto text-lime-300"/>
            <p className="mt-2 text-sm font-bold">Aucune notification</p>
            <p className="text-xs text-white/45 mt-1">Tu recevras ici les mises à jour de commandes, tournois, récompenses et VIP.</p>
          </div>
        )}
        {list.map(n=>{
          const Icon = ICONS[n.type] || Bell
          const c = COLORS[n.type] || 'text-white/70 bg-white/5 border-white/10'
          return (
            <button key={n.id}
              onClick={()=>{ markNotifRead(n.id); if(n.link) nav(n.link) }}
              className={`w-full text-left flex gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.04] transition ${!n.read_at ? 'bg-amber-400/[0.03]' : ''}`}>
              <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c}`}><Icon size={18}/></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{n.title}</span>
                  {!n.read_at && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase">Nouveau</span>}
                </span>
                {n.body && <span className="block text-xs text-white/55 mt-0.5 break-words">{n.body}</span>}
                <span className="block text-[10px] text-white/35 mt-1">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PreferencesPanel(){
  const { lang, setLang } = useLang()
  const { user, linkDiscord, unlinkDiscord } = useAuth()
  const [prefs, setPrefs] = useState(()=> getPrefs())
  const [saved, setSaved] = useState(false)
  const [discId, setDiscId] = useState(user?.discord?.id || '')
  const [discTag, setDiscTag] = useState(user?.discord?.tag || '')
  const [discMsg, setDiscMsg] = useState('')
  const [discErr, setDiscErr] = useState('')
  const [discBusy, setDiscBusy] = useState(false)

  useEffect(()=>{
    setDiscId(user?.discord?.id || '')
    setDiscTag(user?.discord?.tag || '')
  }, [user?.discord?.id])

  const saveDiscord = async ()=>{
    setDiscErr(''); setDiscMsg(''); setDiscBusy(true)
    try{
      await linkDiscord({ id: discId, tag: discTag })
      setDiscMsg('Discord lié ✓ Rôle attribué automatiquement si le bot est configuré.')
    }catch(e){
      const m = e.message || ''
      setDiscErr(m === 'need_sql' ? 'Exécute sprint4-sql.txt dans Supabase pour activer la liaison Discord.'
        : m === 'bad_discord_id' ? 'ID Discord invalide — active le mode développeur et copie ton ID (chiffres).'
        : m === 'cloud_only' ? 'Compte email (cloud) requis.'
        : m)
    }finally{ setDiscBusy(false) }
  }
  const removeDiscord = async ()=>{
    setDiscErr(''); setDiscMsg('')
    try{ await unlinkDiscord(); setDiscId(''); setDiscTag(''); setDiscMsg('Discord délié.') }
    catch(e){ setDiscErr(e.message || 'Erreur') }
  }

  const update = (patch)=>{
    const next = savePrefs(patch)
    setPrefs(next)
    setSaved(true)
    setTimeout(()=> setSaved(false), 1500)
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-black flex items-center gap-2">🌍 Langue</h2>
        <p className="text-xs text-white/45 mt-0.5">Choisis la langue de l'interface.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGS.map(l=>(
            <button key={l.id} onClick={()=>{ setLang(l.id); update({}) }}
              className={`px-4 py-2 rounded-xl text-sm font-black border ${lang===l.id ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-black flex items-center gap-2">🔔 Notifications</h2>
        <p className="text-xs text-white/45 mt-0.5">Choisis ce que tu veux recevoir dans ton espace membre.</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
          {PREF_ITEMS.map(item=>{
            const on = prefs[item.key] !== false
            return (
              <button key={item.key} onClick={()=>update({ [item.key]: !on })}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-lime-400/40 bg-lime-400/[0.06]' : 'border-white/10 bg-black/20'}`}>
                <span className={`w-10 h-5 rounded-full p-0.5 transition ${on ? 'bg-lime-400' : 'bg-white/15'}`}>
                  <span className={`block w-4 h-4 rounded-full bg-black transition ${on ? 'translate-x-5' : ''}`}/>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-[11px] text-white/45">{item.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[#5865F2]/30 bg-[#5865F2]/[0.06] p-5">
        <h2 className="font-black flex items-center gap-2">💬 Discord</h2>
        <p className="text-xs text-white/45 mt-0.5">Lie ton compte pour recevoir le rôle joueur et les annonces tournois automatiquement.</p>
        {user?.discord?.id ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="px-3 py-2 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-sm font-bold">✓ {user.discord.tag || `ID ${user.discord.id}`}</span>
            <button onClick={removeDiscord} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">Délier</button>
          </div>
        ) : (
          <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input value={discId} onChange={e=>setDiscId(e.target.value)} placeholder="ID Discord (17-20 chiffres)"
              className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs"/>
            <input value={discTag} onChange={e=>setDiscTag(e.target.value)} placeholder="Pseudo Discord (optionnel)"
              className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs"/>
            <button onClick={saveDiscord} disabled={discBusy || !discId.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-black disabled:opacity-50">
              {discBusy ? '...' : 'Lier'}
            </button>
          </div>
        )}
        <p className="mt-2 text-[11px] text-white/35">Discord → Paramètres → Avancés → Mode développeur → clic droit sur ton profil → Copier l’identifiant.</p>
        {discMsg && <p className="mt-2 text-xs text-emerald-300">{discMsg}</p>}
        {discErr && <p className="mt-2 text-xs text-red-300">{discErr}</p>}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-black flex items-center gap-2">🎛️ Apparence</h2>
        <p className="text-xs text-white/45 mt-0.5">Thème sombre par défaut — le thème clair arrive bientôt.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-4 py-2 rounded-xl text-sm font-black border bg-lime-400 border-lime-400 text-black">🌙 Sombre</span>
          <span className="px-4 py-2 rounded-xl text-sm font-bold border border-white/10 bg-white/5 text-white/35 cursor-not-allowed">☀️ Clair — bientôt</span>
        </div>
        <button onClick={()=>update({ animations: prefs.animations === false })}
          className={`mt-4 flex items-center gap-3 rounded-2xl border p-3 text-left transition w-full ${prefs.animations !== false ? 'border-lime-400/40 bg-lime-400/[0.06]' : 'border-white/10 bg-black/20'}`}>
          <span className={`w-10 h-5 rounded-full p-0.5 transition ${prefs.animations !== false ? 'bg-lime-400' : 'bg-white/15'}`}>
            <span className={`block w-4 h-4 rounded-full bg-black transition ${prefs.animations !== false ? 'translate-x-5' : ''}`}/>
          </span>
          <span>
            <span className="block text-sm font-bold">Animations du site</span>
            <span className="block text-[11px] text-white/45">Désactive pour un chargement plus fluide sur mobile.</span>
          </span>
        </button>
        {saved && <p className="mt-3 text-xs text-lime-300">✓ Préférences enregistrées</p>}
      </div>
    </div>
  )
}

export function ReferralPanel(){
  const { user, cloud, inviteLink, xpLogs } = useAuth()
  const [refs, setRefs] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    if(!cloud || !user?.cloud) return
    let alive = true
    ;(async()=>{
      try{
        const { data } = await supabase.from('profiles').select('id,name,email,created_at').eq('referred_by', user.id)
        if(alive) setRefs(data || [])
      }catch{}
    })()
    return ()=>{ alive = false }
  }, [cloud, user?.id])

  const xpEarned = (xpLogs || []).filter(l=> l.action==='referral').reduce((s,l)=> s + Number(l.xp||0), 0)
  const count = refs.length || (xpLogs || []).filter(l=> l.action==='referral').length

  const TIERS = [
    { n:1, reward:'+50 XP', label:'Premier filleul' },
    { n:3, reward:'+100 XP bonus', label:'Petite équipe' },
    { n:5, reward:'+250 XP bonus', label:'Recruteur' },
    { n:10, reward:'7 jours VIP', label:'Ambassadeur ZTC' },
  ]

  const copy = async ()=>{
    try{ await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(()=>setCopied(false), 2000) }catch{}
  }
  const share = `https://wa.me/?text=${encodeURIComponent('Rejoins ZTC-GAMING 🎮 ' + inviteLink)}`

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-lime-500/25 bg-gradient-to-br from-lime-500/10 to-transparent p-5">
        <h2 className="font-black flex items-center gap-2">🎁 Parrainage</h2>
        <p className="text-xs text-white/50 mt-0.5">Invite tes amis : chaque inscription = <b className="text-lime-300">+50 XP</b> pour toi.</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input readOnly value={inviteLink || ''} placeholder="Connecte-toi avec un compte email pour obtenir ton lien"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs"/>
          <button onClick={copy} disabled={!inviteLink} className="px-4 py-2.5 rounded-xl bg-lime-400 text-black text-sm font-black disabled:opacity-50">
            {copied ? '✓ Copié' : 'Copier'}
          </button>
          {inviteLink && <a href={share} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-[#25D366]/90 text-black text-sm font-black text-center">WhatsApp</a>}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
            <div className="text-xl font-black text-lime-300">{count}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/45">Filleuls</div>
          </div>
          <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
            <div className="text-xl font-black text-lime-300">{xpEarned}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/45">XP gagné</div>
          </div>
          <div className="rounded-2xl bg-black/30 border border-white/10 p-3">
            <div className="text-xl font-black text-lime-300">{refs.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/45">Comptes liés</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-black text-sm">Paliers de parrainage</h2>
        <div className="mt-3 space-y-2">
          {TIERS.map(t=>{
            const done = count >= t.n
            const pct = Math.min(100, Math.round((count / t.n) * 100))
            return (
              <div key={t.n} className={`rounded-2xl border p-3 ${done ? 'border-lime-400/40 bg-lime-400/[0.06]' : 'border-white/10 bg-black/20'}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{done ? '✓' : '🎯'} {t.label} <span className="text-white/40">({t.n} ami{t.n>1?'s':''})</span></span>
                  <span className={`font-black ${done ? 'text-lime-300' : 'text-white/50'}`}>{t.reward}</span>
                </div>
                {!done && <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-lime-400" style={{ width:`${pct}%` }}/></div>}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-white/35">Les bonus de paliers sont crédités manuellement par l'admin après vérification.</p>
      </div>

      {refs.length>0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-black text-sm">Mes filleuls</h2>
          <div className="mt-2 divide-y divide-white/5">
            {refs.map(r=>(
              <div key={r.id} className="py-2 flex items-center gap-2 text-xs">
                <span className="w-7 h-7 rounded-full bg-lime-400/15 border border-lime-400/30 text-lime-300 flex items-center justify-center font-black">{(r.name||r.email||'?')[0].toUpperCase()}</span>
                <span className="font-bold truncate">{r.name || (r.email||'').split('@')[0]}</span>
                <span className="ml-auto text-white/35">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
