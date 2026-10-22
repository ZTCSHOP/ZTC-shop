import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS = [
  { id:'new', label:'Nouvelle' },
  { id:'contacted', label:'Contactée' },
  { id:'accepted', label:'Retenue' },
  { id:'rejected', label:'Refusée' },
]
const statusLabel = (s)=> STATUS.find(x=>x.id===s)?.label || s || '—'
const statusColor = (s)=> s==='accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  : s==='rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30'
  : s==='contacted' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'

const COLS = [
  ['created_at','Date'],['game','Jeu'],['pseudo','Pseudo'],['nom','Nom'],['age','Âge'],['phone','Téléphone'],
  ['discord','Discord'],['email','Email'],['ville','Ville'],['rank','Rang'],['role','Rôle'],['tracker','Tracker'],
  ['experience','Expérience'],['dispo','Dispo'],['motivation','Motivation'],['video','Vidéo'],['status','Statut'],
]

function toCsv(rows){
  const esc = (v)=>{
    if(v==null) return ''
    const s = String(v).replace(/"/g,'""')
    return /[";\n\r]/.test(s) ? `"${s}"` : s
  }
  const head = COLS.map(c=>c[1]).join(';')
  const body = rows.map(r=> COLS.map(([k])=>{
    const v = r[k]
    if(k==='created_at' && v) return new Date(v).toLocaleString('fr-FR')
    if(k==='status') return statusLabel(v)
    return esc(v)
  }).join(';'))
  return '\uFEFF' + [head, ...body].join('\r\n')
}

export default function AdminApplications(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [q, setQ] = useState('')
  const [game, setGame] = useState('all')

  const load = async ()=>{
    setLoading(true)
    try{
      const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending:false }).limit(1000)
      if(error) throw error
      setRows(data || [])
      setMissing(false)
    }catch(e){
      setRows([])
      setMissing(/does not exist|schema cache|42P01|PGRST205/i.test(String(e?.message||'')))
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  const games = useMemo(()=> [...new Set(rows.map(r=>r.game).filter(Boolean))], [rows])
  const filtered = useMemo(()=> rows.filter(r=>{
    if(game!=='all' && r.game!==game) return false
    if(!q.trim()) return true
    const s = q.toLowerCase()
    return [r.pseudo,r.nom,r.email,r.discord,r.phone,r.game].some(v=> String(v||'').toLowerCase().includes(s))
  }), [rows, q, game])

  const exportCsv = ()=>{
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `candidatures-ztc-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    setTimeout(()=> URL.revokeObjectURL(a.href), 1500)
  }

  const setStatus = async (id, status)=>{
    const prev = rows
    setRows(list=> list.map(r=> r.id===id ? { ...r, status } : r))
    try{
      const { error } = await supabase.from('applications').update({ status }).eq('id', id)
      if(error) throw error
    }catch(e){
      setRows(prev)
      alert('Mise à jour impossible : ' + (e.message || 'erreur'))
    }
  }

  if(missing) return (
    <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-[13px] text-amber-200 leading-relaxed">
      <p className="font-black">Table <code>applications</code> introuvable.</p>
      <p className="mt-1">Exécute <b>supabase-recrutement.sql</b> dans Supabase (SQL Editor) puis clique sur « Rafraîchir ».</p>
      <button onClick={load} className="mt-3 px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black">Rafraîchir</button>
    </div>
  )

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher pseudo, email, Discord…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
        </div>
        <select value={game} onChange={e=>setGame(e.target.value)} className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm">
          <option value="all">Tous les jeux</option>
          {games.map(g=> <option key={g} value={g}>{g}</option>)}
        </select>
        <button onClick={load} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold flex items-center gap-1.5"><RefreshCw size={14}/> Rafraîchir</button>
        <button onClick={exportCsv} disabled={filtered.length===0}
          className="px-4 py-2.5 rounded-xl bg-lime-400 text-black text-sm font-black flex items-center gap-1.5 disabled:opacity-50">
          <Download size={15}/> Exporter Excel ({filtered.length})
        </button>
      </div>

      {loading && <p className="text-xs text-white/45">Chargement…</p>}
      {!loading && filtered.length===0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
          Aucune candidature enregistrée.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r=>(
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm">{r.pseudo || r.nom || r.email || 'Candidat'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/60">{r.game}</span>
              {r.rank && <span className="text-[11px] text-white/50">{r.rank}</span>}
              {r.role && <span className="text-[11px] text-white/50">• {r.role}</span>}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
              <span className="ml-auto text-[11px] text-white/35">{r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : ''}</span>
            </div>
            <div className="mt-1 grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-white/55">
              {r.email && <span>✉️ {r.email}</span>}
              {r.phone && <span>📞 {r.phone}</span>}
              {r.discord && <span>💬 {r.discord}</span>}
              {r.ville && <span>📍 {r.ville}</span>}
              {r.tracker && <span className="truncate">🔗 {r.tracker}</span>}
              {r.dispo && <span>🕒 {r.dispo}</span>}
            </div>
            {r.motivation && <p className="mt-2 text-[11.5px] text-white/45 line-clamp-2">{r.motivation}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS.map(s=>(
                <button key={s.id} onClick={()=>setStatus(r.id, s.id)} disabled={r.status===s.id}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${r.status===s.id ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  {s.label}
                </button>
              ))}
              {r.video && <a href={r.video} target="_blank" rel="noreferrer" className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold border border-white/10 bg-white/5">Voir la vidéo</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
