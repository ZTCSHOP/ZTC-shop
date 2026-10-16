import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Trophy, Calendar, Users, Gift, Ticket, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import BracketView from '../components/BracketView'
import { computeStandings } from '../lib/bracket'
import { ytId } from '../lib/video'

export default function TournamentDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { tournaments, regsFor, myRegs, registerMyTeam, myTeams, saveTournament, user } = useAuth()
  const { t } = useLang()
  const tr = tournaments.find(x=> x.id===id)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [teamId, setTeamId] = useState(null)
  const [flash, setFlash] = useState(false)

  if(!tr) return <div className="max-w-[800px] mx-auto px-4 py-16 text-center">{t('no_result')} <Link to="/tournaments" className="text-amber-300">← {t('tournaments')}</Link></div>

  const regs = regsFor(tr.id)
  const vid = ytId(tr.video)
  const full = regs.length >= (tr.max_teams||16)
  const mine = user ? regs.find(r=> r.userId===user.id) : myRegs().find(r=> r.tournament_id===tr.id)
  const canRegister = tr.status==='open' && !full && !mine
  // Équipes de l'utilisateur créées sur le site
  const owned = user ? myTeams() : []
  const chosen = owned.find(x=> x.id===(teamId || owned[0]?.id)) || owned[0] || null

  const goRegister = ()=>{
    document.getElementById('tournament-register')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(true)
    setTimeout(()=>setFlash(false), 1900)
  }

  const submitOneClick = async ()=>{
    setError('')
    if(!user) return nav('/login', { state: { from: `/tournaments/${tr.id}` } })
    if(!chosen) return
    setSaving(true)
    try{
      if(user.isAdmin){
        try{ await saveTournament({ ...tr }) }catch{}
      }
      await registerMyTeam({ tournamentId: tr.id, team: chosen })
      setDone(true)
    }catch(err){
      const m = err.message||''
      setError(
        m==='already' ? t('tr_already')
        : m==='notowner' ? t('tr_notowner')
        : m.includes('foreign key') ? t('tr_need_sync')
        : m
      )
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/tournaments" className="text-sm text-white/60 hover:text-white">← {t('tournaments')}</Link>
      <div className="mt-4 rounded-3xl overflow-hidden bg-white/5 border border-white/10">
        <div className="relative h-56 md:h-72">
          <img src={tr.image} alt={tr.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/>
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black text-amber-400 uppercase tracking-widest">{tr.game} • {tr.status==='open'?t('tr_open'):tr.status==='done'?t('tr_done'):t('tr_soon')}</div>
              <h1 className="text-2xl md:text-4xl font-black">{tr.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15 font-bold">{(tr.elimination||'single')==='double'?'Double Elimination':'Single Elimination'}</span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">Final {tr.final_format||'BO1'} • Phases BO1</span>
              </div>
            </div>
            {mine ? (
              <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm flex items-center gap-2 shrink-0"><Check size={16}/> {mine.team}</div>
            ) : tr.status!=='open' ? (
              <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white/60 font-black text-sm shrink-0">{tr.status==='done'?t('tr_done'):t('tr_soon')}</div>
            ) : full ? (
              <div className="px-5 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 font-black text-sm shrink-0">{t('tr_full')}</div>
            ) : (
              <button onClick={goRegister} className="btn-join px-8 py-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xl tracking-wide shrink-0">
                ⚡ JOIN
                <span className="block text-[11px] font-bold opacity-70">{t('tr_register')}</span>
              </button>
            )}
          </div>
        </div>
        <div className="p-5 grid sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Calendar size={12}/> Date</div><div className="font-bold mt-0.5">{tr.date ? new Date(tr.date).toLocaleString() : '—'}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Gift size={12}/> {t('tr_prize')}</div><div className="font-bold mt-0.5 text-amber-300">{tr.prize||'—'}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Users size={12}/> {t('tr_slots')}</div><div className="font-bold mt-0.5">{regs.length}/{tr.max_teams||16}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Ticket size={12}/> {t('tr_entry')}</div><div className="font-bold mt-0.5">{Number(tr.entry_fee)>0 ? `${tr.entry_fee} TND` : t('tr_free')}</div></div>
        </div>
      </div>

      {vid && (
        <div className="mt-6">
          <h2 className="font-black mb-3">🎬 {t('tr_video')}</h2>
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video">
            <iframe src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0`} title={tr.title} className="w-full h-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
          </div>
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-black mb-2">{t('tr_rules')}</h2>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{tr.rules||'—'}</p>
          <h2 className="font-black mt-6 mb-2">{t('tr_participants')} ({regs.length})</h2>
          <div className="flex flex-wrap gap-2">
            {regs.length===0 && <span className="text-sm text-white/40">—</span>}
            {regs.map(r=> <Link key={r.id} to={`/teams/${encodeURIComponent(r.team)}`} className="text-xs px-2 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 hover:border-amber-500">{r.logo ? <img src={r.logo} alt="" className="w-5 h-5 rounded-full object-cover bg-white"/> : '🛡️'} {r.team}</Link>)}
          </div>
        </div>

      <div className="mt-6 lg:col-span-2">
        <h2 className="font-black mb-3">🏆 {t('bracket')}</h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 overflow-x-auto">
          <BracketView bracket={tr.bracket || []} />
        </div>
        {computeStandings(tr.bracket || []).length>0 && (
          <div className="mt-4">
            <h2 className="font-black mb-2">📊 {t('standings')}</h2>
            <div className="rounded-xl overflow-hidden border border-white/10 text-sm max-w-md">
              <div className="grid grid-cols-[1fr_50px_50px_50px] bg-white/5 px-3 py-2 text-xs text-white/50 font-bold"><span>{t('tr_participants')}</span><span className="text-center">{t('wins')}</span><span className="text-center">{t('losses')}</span><span className="text-center">{t('pts')}</span></div>
              {computeStandings(tr.bracket || []).map((s,i)=>(
                <div key={s.team} className="grid grid-cols-[1fr_50px_50px_50px] px-3 py-2 border-t border-white/5">
                  <span className="font-bold truncate">{i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':''}{s.team}</span>
                  <span className="text-center">{s.w}</span><span className="text-center">{s.l}</span><span className="text-center font-black text-amber-300">{s.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        <div id="tournament-register" className={`rounded-2xl bg-white/5 border border-white/10 p-5 h-fit scroll-mt-24 ${flash ? 'reg-flash' : ''}`}>
          {done ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-emerald-400"/>
              <div className="font-black mt-2">{t('tr_register_ok')}</div>
            </div>
          ) : mine ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-emerald-400"/>
              <div className="font-black mt-2">{t('tr_myteam')}</div>
              <div className="text-sm text-white/60">{mine.team}</div>
            </div>
          ) : !canRegister ? (
            <div className="text-center py-6 text-white/50 text-sm">{full ? t('tr_full') : tr.status!=='open' ? (tr.status==='done'?t('tr_done'):t('tr_soon')) : t('tr_login_needed')}</div>
          ) : !user ? (
            <div className="text-center py-6">
              <div className="font-black mb-2">{t('tr_register')}</div>
              <p className="text-sm text-white/50 mb-4">{t('tr_login_needed')}</p>
              <Link to="/login" state={{ from: `/tournaments/${tr.id}` }} className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm">{t('login')}</Link>
            </div>
          ) : owned.length===0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🛡️</div>
              <div className="font-black mb-1">{t('tr_no_team_t')}</div>
              <p className="text-sm text-white/50 mb-4">{t('tr_no_team_d')}</p>
              <Link to="/teams?tab=create" className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm">＋ {t('tr_create_team_btn')}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-black">{t('tr_register')}</h3>
              {owned.length>1 && (
                <div>
                  <div className="text-xs text-white/50 mb-1">{t('tr_choose_team')}</div>
                  <select value={chosen?.id||''} onChange={e=>setTeamId(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-amber-500">
                    {owned.map(o=> <option key={o.id} value={o.id}>{o.name} • {o.game}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5">
                {chosen?.logo
                  ? <img src={chosen.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white"/>
                  : <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">🛡️</span>}
                <div className="min-w-0">
                  <div className="font-black text-sm truncate">{chosen?.name}</div>
                  <div className="text-xs text-white/50">🎮 {chosen?.game}{chosen?.captain ? ` • ${chosen.captain}` : ''}</div>
                </div>
              </div>
              {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</div>}
              <button onClick={submitOneClick} disabled={saving || !chosen} className="btn-shine w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black disabled:opacity-60">
                {saving ? '...' : `⚡ ${t('tr_register_oneclick')}`}
              </button>
              <p className="text-[11px] text-white/40 text-center">{t('tr_no_form_needed')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
