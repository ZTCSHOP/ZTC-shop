import { useState, useEffect } from 'react'
import { Plus, Shuffle, RotateCcw, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { generateBracket, computeStandings, getChampion } from '../lib/bracket'
import BracketView from './BracketView'

const CK_KEY = (tid)=> `ztc_checkin_${tid}`
const loadCk = (tid)=> { try { return JSON.parse(localStorage.getItem(CK_KEY(tid))||'{}') } catch { return {} } }

export default function TournamentManager({ tr }){
  const { regsFor, addTeamManual, saveTournament, deleteReg } = useAuth()
  const { t } = useLang()
  const [teamName, setTeamName] = useState('')
  const [shuffle, setShuffle] = useState(true)
  const [msg, setMsg] = useState('')

  const regs = regsFor(tr.id)
  const teams = [...new Set(regs.map(r=> r.team).filter(Boolean))]
  const bracket = tr.bracket || []
  const standings = computeStandings(bracket)

  // ---- Check-in admin : validated / waitlist / absent (stocké local, par navigateur) ----
  const [ck, setCk] = useState(()=> loadCk(tr.id))
  const [menuFor, setMenuFor] = useState(null) // regId dont le menu statut est ouvert
  useEffect(()=>{ setCk(loadCk(tr.id)) }, [tr.id])
  const statusOf = (r)=> ck[r.id] || 'validated'
  const setStatus = (r, s)=> setCk(prev=>{ const n = { ...prev, [r.id]: s }; try{ localStorage.setItem(CK_KEY(tr.id), JSON.stringify(n)) }catch{}; return n })
  const validatedRegs = regs.filter(r=> statusOf(r)==='validated')
  const waitRegs = regs.filter(r=> statusOf(r)==='waitlist')
  const absentRegs = regs.filter(r=> statusOf(r)==='absent')
  const stBadge = (s)=> s==='validated'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : s==='waitlist' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-red-500/20 text-red-300 border-red-500/40'
  const stLabel = (s)=> s==='validated' ? 'Validated' : s==='waitlist' ? 'Waitlist' : 'Absent'

  const addTeam = async (e)=>{
    e.preventDefault(); setMsg('')
    try{ await addTeamManual(tr.id, teamName); setTeamName('') }
    catch(err){ setMsg(err.message==='need_sql' ? t('tm_db_err') : t('team_ph')) }
  }

  const generate = async ()=>{
    setMsg('')
    try{
      // Bracket généré UNIQUEMENT avec les équipes Validated (si au moins 2), sinon toutes
      const pool = validatedRegs.length>=2 ? validatedRegs : regs
      const names = [...new Set(pool.map(r=> r.team).filter(Boolean))]
      if(names.length < 2){ setMsg(t('need_teams')); return }
      const b = generateBracket(names, shuffle)
      await saveTournament({ ...tr, bracket: b })
      if(validatedRegs.length>=2 && validatedRegs.length<regs.length) setMsg(`Bracket généré avec ${validatedRegs.length} équipes validées (${waitRegs.length} waitlist, ${absentRegs.length} absent — exclus).`)
    }catch{ setMsg(t('need_teams')) }
  }

  const reset = async ()=>{
    if(!window.confirm(t('reset_bracket_q'))) return
    await saveTournament({ ...tr, bracket: [] })
  }

  const validateMatch = async (newBracket)=>{
    await saveTournament({ ...tr, bracket: newBracket })
  }

  // ---- Tournoi terminé : résultats en lecture seule (pas de Generate/Reset) ----
  if(tr.status==='done'){
    const champ = getChampion(bracket)
    return (
      <div className="mt-3 rounded-2xl bg-black/30 border border-emerald-500/20 p-4 space-y-4">
        <div className="text-sm font-black">🏁 {t('tr_done')}</div>
        {champ && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-sm font-black text-amber-300 flex items-center gap-2">
            🏆 {t('champion')} : {champ}
          </div>
        )}
        {bracket.length>0 && <BracketView bracket={bracket} />}
        {standings.length>0 && (
          <div>
            <div className="text-sm font-black mb-2">📊 {t('standings')}</div>
            <div className="rounded-xl overflow-hidden border border-white/10 text-sm">
              <div className="grid grid-cols-[1fr_50px_50px_50px] bg-white/5 px-3 py-2 text-xs text-white/50 font-bold"><span>{t('tr_participants')}</span><span className="text-center">{t('wins')}</span><span className="text-center">{t('losses')}</span><span className="text-center">{t('pts')}</span></div>
              {standings.map((s,i)=>(
                <div key={s.team} className="grid grid-cols-[1fr_50px_50px_50px] px-3 py-2 border-t border-white/5">
                  <span className="font-bold truncate">{i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''}{s.team}</span>
                  <span className="text-center">{s.w}</span><span className="text-center">{s.l}</span><span className="text-center font-black text-amber-300">{s.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-2xl bg-black/30 border border-amber-500/20 p-4 space-y-4">
      {/* Équipes */}
      <div>
        <div className="text-sm font-black mb-2">🛡️ {t('tr_participants')} ({teams.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {teams.map(nm=> <span key={nm} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10">{nm}</span>)}
          {teams.length===0 && <span className="text-xs text-white/40">—</span>}
        </div>
        <form onSubmit={addTeam} className="flex gap-2 mt-2">
          <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder={t('add_team_ph')} className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-amber-500"/>
          <button className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-black flex items-center gap-1"><Plus size={14}/> {t('add_team_btn')}</button>
        </form>
      </div>

      {/* Génération */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs flex items-center gap-1.5 text-white/60">
          <input type="checkbox" checked={shuffle} onChange={e=>setShuffle(e.target.checked)} className="accent-amber-500"/> <Shuffle size={12}/> {t('shuffle')}
        </label>
        <button onClick={generate} className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-sm font-black">{t('gen_bracket')}</button>
        {bracket.length>0 && (
          <button onClick={reset} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs flex items-center gap-1"><RotateCcw size={12}/> {t('reset_bracket')}</button>
        )}
      </div>
      {msg && <div className="text-xs text-red-400">{msg}</div>}

      {/* Bracket éditable */}
      {bracket.length>0 && <BracketView bracket={bracket} onValidate={validateMatch} />}

      {/* Classement */}
      {standings.length>0 && (
        <div>
          <div className="text-sm font-black mb-2">📊 {t('standings')}</div>
          <div className="rounded-xl overflow-hidden border border-white/10 text-sm">
            <div className="grid grid-cols-[1fr_50px_50px_50px] bg-white/5 px-3 py-2 text-xs text-white/50 font-bold"><span>{t('tr_participants')}</span><span className="text-center">{t('wins')}</span><span className="text-center">{t('losses')}</span><span className="text-center">{t('pts')}</span></div>
            {standings.map((s,i)=>(
              <div key={s.team} className="grid grid-cols-[1fr_50px_50px_50px] px-3 py-2 border-t border-white/5">
                <span className="font-bold truncate">{i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''}{s.team}</span>
                <span className="text-center">{s.w}</span><span className="text-center">{s.l}</span><span className="text-center font-black text-amber-300">{s.pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in : tableau équipes inscrites + statut */}
      {regs.length>0 && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-2 text-center text-xs font-black">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-2 py-2">✅ Validated Teams<div className="text-lg text-emerald-300">{validatedRegs.length}</div></div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-2 py-2">⏳ Waitlist Queue<div className="text-lg text-amber-300">{waitRegs.length}</div></div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-2 py-2">👥 Total Participants<div className="text-lg">{regs.length}</div></div>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 text-xs">
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-white/5 px-3 py-2 font-black text-white/50 uppercase tracking-wider text-[11px]">
              <span>Team Name</span><span className="hidden sm:block">Captain (Game)</span><span className="hidden sm:block">Contact ID</span><span>Status</span>
            </div>
            {regs.map(r=>(
              <div key={r.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2 border-t border-white/5">
                <span className="font-bold truncate">{r.team}{r.checkedIn && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 align-middle">✔ {t('tr_checked')}</span>}<span className="block sm:hidden text-white/40 font-normal">{r.captain} • 📞 {r.phone||'—'}</span></span>
                <span className="hidden sm:block text-white/60 truncate">{r.captain} ({r.game_id||tr.game})</span>
                <span className="hidden sm:block text-emerald-300 font-bold truncate">📞 {r.phone||'—'}</span>
                <span className="flex items-center gap-1 relative">
                  <button onClick={()=>setMenuFor(menuFor===r.id?null:r.id)} title="Choisir le statut" className={`px-2 py-1 rounded-full border text-[11px] font-black ${stBadge(statusOf(r))}`}>{stLabel(statusOf(r))} ▾</button>
                  {menuFor===r.id && (
                    <>
                      <span className="fixed inset-0 z-10" onClick={()=>setMenuFor(null)} />
                      <span className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden border border-white/15 bg-[#141417] shadow-xl flex flex-col min-w-[110px]">
                        {['validated','waitlist','absent'].map(s=>(
                          <button key={s} onClick={()=>{ setStatus(r, s); setMenuFor(null) }} className={`text-left px-3 py-2 text-[11px] font-black hover:bg-white/10 ${s===statusOf(r)?'text-emerald-300':'text-white/70'}`}>{s==='validated'?'✅ Validated':s==='waitlist'?'⏳ Waitlist':'⛔ Absent'}</button>
                        ))}
                      </span>
                    </>
                  )}
                  <button onClick={async()=>{ if(window.confirm(t('del_order_q'))){ try{ await deleteReg(r.id) }catch{ alert(t('del_need_policy')) } } }} className="text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
                </span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-white/40 mt-1">Clique sur le statut w e5tar : ✅ Validated / ⏳ Waitlist / ⛔ Absent. Le bracket utilise uniquement les Validated.</div>
        </div>
      )}
    </div>
  )
}
