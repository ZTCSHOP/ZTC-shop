import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Shield, UserRound, X, Copy, Check, Trash2, Lock, Unlock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LFG_GAMES, LFG_REGIONS, gameIcon, gameLabel, ranksFor, rolesFor, timeAgoShort } from '../lib/lfg'

const KINDS = [
  { id: 'all', label: 'Tout' },
  { id: 'player', label: 'Joueurs' },
  { id: 'team', label: 'Équipes' },
]

function Chip({ active, children, onClick, className='' }){
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${active ? 'bg-amber-400 border-amber-400 text-black' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'} ${className}`}>
      {children}
    </button>
  )
}

export default function LFG(){
  const { user, cloud, lfgPosts, createLfgPost, closeLfgPost, deleteLfgPost, myTeams } = useAuth()
  const [params] = useSearchParams()
  const initGame = LFG_GAMES.some(g=> g.id===params.get('game')) ? params.get('game') : ''
  const initKind = ['player','team'].includes(params.get('kind')) ? params.get('kind') : 'all'
  const [kind, setKind] = useState(initKind)
  const [game, setGame] = useState(initGame)
  const [rank, setRank] = useState('')
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    kind: initKind === 'team' ? 'team' : 'player', game: initGame || 'valorant', rank: '', roles: [], region: 'Tunisie',
    description: '', contact: '', teamName: '',
  })

  const owned = user ? myTeams() : []

  const posts = useMemo(()=>{
    const needle = q.trim().toLowerCase()
    return (lfgPosts || [])
      .filter(p=> showClosed ? true : p.status === 'open')
      .filter(p=> kind === 'all' || p.kind === kind)
      .filter(p=> !game || p.game === game)
      .filter(p=> !rank || p.rank === rank)
      .filter(p=> !role || (p.roles || []).includes(role))
      .filter(p=> !needle || [p.description, p.authorName, p.teamName, p.rank, ...(p.roles||[])].join(' ').toLowerCase().includes(needle))
      .sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))
  }, [lfgPosts, kind, game, rank, role, q, showClosed])

  const set = (patch)=> setForm(f=> ({ ...f, ...patch }))
  const toggleRole = (r)=> set({ roles: form.roles.includes(r) ? form.roles.filter(x=> x!==r) : [...form.roles, r].slice(0, 5) })

  const submit = async (e)=>{
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
    try{
      await createLfgPost(form)
      setForm({ kind: form.kind, game: form.game, rank: '', roles: [], region: form.region, description: '', contact: '', teamName: '' })
      setOpenForm(false)
      setMsg('Annonce publiée ✓')
    }catch(ex){
      const m = ex.message || ''
      setErr(m === 'need_sql' ? 'Exécute sprint4-sql.txt dans Supabase pour activer le LFG.'
        : m === 'cloud_only' ? 'Le LFG nécessite un compte email (cloud).'
        : m === 'description' ? 'Écris au moins 10 caractères de description.'
        : m === 'login' ? 'Connecte-toi pour publier une annonce.'
        : m)
    }finally{ setBusy(false) }
  }

  const copy = async (text)=>{
    try{ await navigator.clipboard.writeText(text); setCopied(text); setTimeout(()=>setCopied(''), 1800) }catch{}
  }

  const close = async (p)=>{
    try{ await closeLfgPost(p.id, p.status === 'open' ? 'closed' : 'open') }
    catch(ex){ setErr(ex.message || 'Erreur') }
  }
  const remove = async (p)=>{
    if(!window.confirm('Supprimer cette annonce ?')) return
    try{ await deleteLfgPost(p.id) }
    catch(ex){ setErr(ex.message || 'Erreur') }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.10] via-transparent to-transparent p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">ZTC Esports — Communauté</div>
            <h1 className="text-2xl md:text-4xl font-black mt-1">LFG &amp; Matchmaking</h1>
            <p className="text-sm text-white/55 mt-1 max-w-2xl">
              Trouve des coéquipiers, complète ton effectif ou recrute pour ton équipe. Filtre par jeu, rang et rôle.
            </p>
          </div>
          {user ? (
            <button onClick={()=>{ setOpenForm(v=> !v); setErr('') }}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm flex items-center gap-2">
              {openForm ? <X size={16}/> : <Plus size={16}/>} {openForm ? 'Fermer' : 'Publier une annonce'}
            </button>
          ) : (
            <Link to="/login" className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm">Se connecter</Link>
          )}
        </div>
      </div>

      {openForm && user && (
        <form onSubmit={submit} className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-black text-white/50 mb-1.5">Je suis…</div>
              <div className="flex gap-2">
                <Chip active={form.kind==='player'} onClick={()=>set({ kind: 'player' })}>🔎 Un joueur</Chip>
                <Chip active={form.kind==='team'} onClick={()=>set({ kind: 'team' })}>🛡️ Une équipe</Chip>
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-white/50 mb-1.5">Jeu</div>
              <select value={form.game} onChange={e=>set({ game: e.target.value, rank: '', roles: [] })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm">
                {LFG_GAMES.map(g=> <option key={g.id} value={g.id}>{g.icon} {g.label}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs font-black text-white/50 mb-1.5">Rang</div>
              <select value={form.rank} onChange={e=>set({ rank: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm">
                <option value="">— Non précisé —</option>
                {ranksFor(form.game).map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs font-black text-white/50 mb-1.5">Région</div>
              <select value={form.region} onChange={e=>set({ region: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm">
                {LFG_REGIONS.map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs font-black text-white/50 mb-1.5">Rôles recherchés / joués</div>
            <div className="flex flex-wrap gap-1.5">
              {rolesFor(form.game).map(r=> (
                <Chip key={r} active={form.roles.includes(r)} onClick={()=>toggleRole(r)}>{r}</Chip>
              ))}
            </div>
          </div>
          {form.kind === 'team' && (
            <div>
              <div className="text-xs font-black text-white/50 mb-1.5">Nom de l’équipe</div>
              <input value={form.teamName} onChange={e=>set({ teamName: e.target.value })}
                list="lfg-teams" placeholder="Ex: Faracha" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
              <datalist id="lfg-teams">{owned.map(t=> <option key={t.id} value={t.name}/>)}</datalist>
            </div>
          )}
          <div>
            <div className="text-xs font-black text-white/50 mb-1.5">Description</div>
            <textarea value={form.description} onChange={e=>set({ description: e.target.value })} rows={4} maxLength={600}
              placeholder={form.kind==='team' ? 'Décris ton équipe, ton niveau, les horaires de scrim…' : 'Décris ton profil, ton rang, tes disponibilités…'}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm resize-y"/>
            <div className="text-[10px] text-white/35 text-right">{form.description.length}/600</div>
          </div>
          <div>
            <div className="text-xs font-black text-white/50 mb-1.5">Contact (Discord / WhatsApp / autre)</div>
            <input value={form.contact} onChange={e=>set({ contact: e.target.value })} maxLength={120}
              placeholder="Ex: pseudo#1234 ou +216 …" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
          </div>
          {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl p-2.5">{err}</div>}
          <button disabled={busy} className="px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black text-sm disabled:opacity-60">
            {busy ? 'Publication…' : 'Publier l’annonce'}
          </button>
          {!cloud && <p className="text-[11px] text-amber-300/80">Mode démo : le LFG a besoin de Supabase.</p>}
        </form>
      )}

      {msg && <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5">{msg}</div>}

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {KINDS.map(k=> <Chip key={k.id} active={kind===k.id} onClick={()=>setKind(k.id)}>{k.label}</Chip>)}
          <span className="w-px h-5 bg-white/10 mx-1"/>
          <select value={game} onChange={e=>{ setGame(e.target.value); setRank(''); setRole('') }}
            className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs font-bold">
            <option value="">Tous les jeux</option>
            {LFG_GAMES.map(g=> <option key={g.id} value={g.id}>{g.icon} {g.label}</option>)}
          </select>
          <select value={rank} onChange={e=>setRank(e.target.value)} className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs font-bold">
            <option value="">Tous les rangs</option>
            {ranksFor(game || 'valorant').map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={role} onChange={e=>setRole(e.target.value)} className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs font-bold">
            <option value="">Tous les rôles</option>
            {rolesFor(game || 'valorant').map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-white/60 ml-auto">
            <input type="checkbox" checked={showClosed} onChange={e=>setShowClosed(e.target.checked)} className="accent-amber-500"/> Fermées
          </label>
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs"/>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-white/40">{posts.length} annonce{posts.length>1?'s':''}</div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {posts.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-4xl">🎮</div>
            <p className="font-black mt-2">Aucune annonce pour ces filtres</p>
            <p className="text-xs text-white/45 mt-1">Sois le premier à publier — ça prend 30 secondes.</p>
          </div>
        )}
        {posts.map(p=>{
          const isMine = user && (p.userId === user.id || user.isAdmin)
          const contact = p.contact || (p.kind === 'team' ? '' : '')
          return (
            <div key={p.id} className={`rounded-2xl border p-4 flex flex-col gap-3 ${p.status==='closed' ? 'border-white/10 bg-black/20 opacity-70' : 'border-white/10 bg-white/[0.035]'}`}>
              <div className="flex items-start gap-2.5">
                <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${p.kind==='team' ? 'border-amber-400/35 bg-amber-400/10 text-amber-300' : 'border-lime-400/35 bg-lime-400/10 text-lime-300'}`}>
                  {p.kind==='team' ? <Shield size={16}/> : <UserRound size={16}/>}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm truncate">{p.kind==='team' ? (p.teamName || 'Équipe') : (p.authorName || 'Joueur')}</span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{p.kind==='team'?'Recrute':'Cherche équipe'}</span>
                    {p.status!=='open' && <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300">Fermée</span>}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">{timeAgoShort(p.date)} • {p.region || '—'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-[11px] font-bold">{gameIcon(p.game)} {gameLabel(p.game)}</span>
                {p.rank && <span className="px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-[11px] font-bold">🏅 {p.rank}</span>}
                {(p.roles||[]).map(r=> <span key={r} className="px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-200 text-[11px] font-bold">{r}</span>)}
              </div>

              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line line-clamp-4">{p.description || '—'}</p>

              <div className="mt-auto flex items-center gap-2">
                {contact && (
                  <button onClick={()=>copy(contact)} className="flex-1 px-3 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-black flex items-center justify-center gap-1.5">
                    {copied===contact ? <Check size={13}/> : <Copy size={13}/>} {copied===contact ? 'Copié' : 'Copier le contact'}
                  </button>
                )}
                {isMine && (
                  <>
                    <button onClick={()=>close(p)} title={p.status==='open'?'Fermer':'Réouvrir'} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                      {p.status==='open' ? <Lock size={14}/> : <Unlock size={14}/>}
                    </button>
                    <button onClick={()=>remove(p)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20"><Trash2 size={14}/></button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-[11px] text-white/35 text-center">
        Reste fair-play : pas de spam, pas de pub externe. Les annonces abusives sont supprimées par l’admin.
      </p>
    </div>
  )
}
