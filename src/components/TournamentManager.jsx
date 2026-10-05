import { useState } from 'react'
import { Plus, Shuffle, RotateCcw, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { generateBracket, computeStandings } from '../lib/bracket'
import BracketView from './BracketView'

export default function TournamentManager({ tr }){
  const { regsFor, addTeamManual, saveTournament, deleteReg } = useAuth()
  const { t } = useLang()
  const [teamName, setTeamName] = useState('')
  const [shuffle, setShuffle] = useState(true)
  const [msg, setMsg] = useState('')

  const teams = [...new Set(regsFor(tr.id).map(r=> r.team).filter(Boolean))]
  const bracket = tr.bracket || []
  const standings = computeStandings(bracket)

  const addTeam = async (e)=>{
    e.preventDefault(); setMsg('')
    try{ await addTeamManual(tr.id, teamName); setTeamName('') }
    catch(err){ setMsg(err.message==='need_sql' ? t('tm_db_err') : t('team_ph')) }
  }

  const generate = async ()=>{
    setMsg('')
    try{
      if(teams.length < 2){ setMsg(t('need_teams')); return }
      const b = generateBracket(teams, shuffle)
      await saveTournament({ ...tr, bracket: b })
    }catch{ setMsg(t('need_teams')) }
  }

  const reset = async ()=>{
    if(!window.confirm(t('reset_bracket_q'))) return
    await saveTournament({ ...tr, bracket: [] })
  }

  const validateMatch = async (newBracket)=>{
    await saveTournament({ ...tr, bracket: newBracket })
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

      {/* Inscriptions (téléphones) */}
      {regsFor(tr.id).length>0 && (
        <div className="text-xs space-y-1">
          {regsFor(tr.id).map(r=>(
            <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-white/60">
              <span className="font-bold text-white/80">{r.team}</span>
              <span>{r.captain} {r.game_id?`(${r.game_id})`:''}</span>
              {r.phone && <span className="text-emerald-300 font-bold">📞 {r.phone}</span>}
              <button onClick={async()=>{ if(window.confirm(t('del_order_q'))){ try{ await deleteReg(r.id) }catch{ alert(t('del_need_policy')) } } }} className="ml-auto text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
