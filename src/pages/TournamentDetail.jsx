import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Trophy, Calendar, Users, Gift, Ticket, Check, Radio, ShieldCheck, Send, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import BracketView from '../components/BracketView'
import { computeStandings, getChampion } from '../lib/bracket'
import { rosterStatus } from '../lib/roster'
import { ytId } from '../lib/video'

const CHECKIN_WINDOW_MS = 2 * 60 * 60 * 1000

export default function TournamentDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { tournaments, regsFor, myRegs, registerMyTeam, myTeams, saveTournament, user, checkInTeam, matchReports, submitMatchReport } = useAuth()
  const { t } = useLang()
  const tr = tournaments.find(x=> x.id===id)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [teamId, setTeamId] = useState(null)
  const [flash, setFlash] = useState(false)
  const [now, setNow] = useState(()=> Date.now())
  const [ckMsg, setCkMsg] = useState('')
  const [ckBusy, setCkBusy] = useState('')
  const [ckError, setCkError] = useState(false)
  const [repKey, setRepKey] = useState('')
  const [repA, setRepA] = useState('')
  const [repB, setRepB] = useState('')
  const [repRiot, setRepRiot] = useState('')
  const [repShot, setRepShot] = useState('')
  const [repNote, setRepNote] = useState('')
  const [repBusy, setRepBusy] = useState(false)
  const [repMsg, setRepMsg] = useState('')
  const [repErr, setRepErr] = useState('')

  const startMs = tr?.date ? new Date(tr.date).getTime() : null
  const checkinOpensAt = Number.isFinite(startMs) ? startMs - CHECKIN_WINDOW_MS : null

  useEffect(()=>{
    if(checkinOpensAt===null || now>=checkinOpensAt) return
    const timer = window.setTimeout(()=> setNow(Date.now()), checkinOpensAt-now)
    return ()=> window.clearTimeout(timer)
  }, [checkinOpensAt, now])

  if(!tr) return <div className="max-w-[800px] mx-auto px-4 py-16 text-center">{t('no_result')} <Link to="/tournaments" className="text-amber-300">← {t('tournaments')}</Link></div>

  const regs = regsFor(tr.id)
  const vid = ytId(tr.video)
  const full = regs.length >= (tr.max_teams||16)
  const mine = user ? regs.find(r=> r.userId===user.id) : myRegs().find(r=> r.tournament_id===tr.id)
  const canRegister = tr.status==='open' && !full && !mine
  // Équipes de l'utilisateur créées sur le site
  const owned = user ? myTeams() : []
  const chosen = owned.find(x=> x.id===(teamId || owned[0]?.id)) || owned[0] || null
  const rosterAvailable = chosen?.roster !== null && chosen?.roster !== undefined
  const chosenRoster = rosterStatus(chosen?.roster, chosen?.game || tr.game)
  const rosterBlocked = rosterAvailable && !chosenRoster.complete
  const champion = getChampion(tr.bracket || [])
  const checkinOpen = checkinOpensAt===null || now >= checkinOpensAt
  const canCheckIn = checkinOpen && tr.status!=='done'
  const finalMatch = (tr.bracket || []).length ? tr.bracket[tr.bracket.length-1].matches?.[0] : null
  const myTeamNames = user ? new Set([...(myRegs()||[]).map(r=> r.team), ...(myTeams()||[]).map(t=> t.name)].filter(Boolean)) : new Set()
  const openMatches = (tr.bracket || []).flatMap((rd, ri)=> (rd.matches||[]).map((m, mi)=> ({ ...m, ri, mi })))
    .filter(m=> m.teamA && m.teamB && !m.winner && (user?.isAdmin || myTeamNames.has(m.teamA) || myTeamNames.has(m.teamB)))
  const trReports = (matchReports || []).filter(x=> x.tournamentId === tr.id).slice(0, 20)
  const selectedMatch = openMatches.find(m=> `${m.ri}-${m.mi}` === repKey) || null

  const sendReport = async (e)=>{
    e.preventDefault()
    setRepErr(''); setRepMsg('')
    if(!selectedMatch) return setRepErr('Sélectionne ton match.')
    setRepBusy(true)
    try{
      await submitMatchReport({
        tournamentId: tr.id, round: selectedMatch.ri, matchIndex: selectedMatch.mi, matchId: selectedMatch.id,
        teamA: selectedMatch.teamA, teamB: selectedMatch.teamB,
        scoreA: repA, scoreB: repB, riotMatchId: repRiot, screenshotUrl: repShot, note: repNote,
      })
      setRepMsg('Score envoyé ✓ En attente de validation par l’admin.')
      setRepA(''); setRepB(''); setRepRiot(''); setRepShot(''); setRepNote('')
    }catch(err){
      const m = err.message || ''
      setRepErr(m === 'need_sql' ? 'Exécute sprint4-sql.txt dans Supabase pour activer les rapports de score.'
        : m === 'draw' ? 'Match nul impossible — vérifie le score.'
        : m === 'cloud_only' ? 'Compte email (cloud) requis.'
        : m === 'login' ? 'Connecte-toi pour soumettre un score.'
        : m)
    }finally{ setRepBusy(false) }
  }

  const goRegister = ()=>{
    document.getElementById('tournament-register')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(true)
    setTimeout(()=>setFlash(false), 1900)
  }

  const doCheckIn = async (regId, checked=true)=>{
    setCkMsg(''); setCkError(false); setCkBusy(regId)
    try{
      await checkInTeam(regId, checked)
      setCkMsg(t(checked ? 'tr_checkin_done' : 'tr_checkin_cancelled'))
    }catch(e){
      setCkError(true)
      setCkMsg(e.message==='need_sql' ? t('tr_checkin_sql') : (e.message==='login' ? t('tr_login_needed') : (e.message||'')))
    }finally{ setCkBusy('') }
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
        : m==='roster' ? 'Complète ton effectif (5 titulaires) avant de t’inscrire.'
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
                {(tr.bracket||[]).length>0 && tr.status!=='done' && <span className="text-[11px] px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-black inline-flex items-center gap-1"><Radio size={11} className="animate-pulse"/> EN DIRECT</span>}
                {tr.status==='open' && <span className={`text-[11px] px-2 py-1 rounded-full border font-bold ${canCheckIn?'bg-emerald-500/15 border-emerald-500/35 text-emerald-300':'bg-white/10 border-white/15 text-white/50'}`}>{canCheckIn?'Check-in ouvert':'Check-in dans les 24 h'}</span>}
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

      {champion && (
        <div className="mt-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/[0.16] via-amber-400/[0.06] to-transparent p-4 flex flex-wrap items-center gap-3">
          <Trophy size={22} className="text-amber-300 shrink-0"/>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/80">Champion du tournoi</div>
            <div className="font-black text-lg flex items-center gap-2">
              {champion}
              {finalMatch?.scoreA!=null && finalMatch?.scoreB!=null && (
                <span className="text-sm text-white/50 font-bold">{Math.max(finalMatch.scoreA, finalMatch.scoreB)} – {Math.min(finalMatch.scoreA, finalMatch.scoreB)}</span>
              )}
            </div>
          </div>
          <Link to={`/teams/${encodeURIComponent(champion)}`} className="ml-auto text-xs font-black text-amber-300 hover:text-amber-200">Voir l’équipe →</Link>
        </div>
      )}

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
          {regs.length>0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-2">
              <span className="text-emerald-300">✅ {regs.filter(r=>r.checkedIn).length}/{regs.length} {t('tr_checked_count')}</span>
              <span className={canCheckIn ? 'text-emerald-300' : 'text-white/45'}>
                {tr.status==='done' ? t('tr_checkin_closed') : canCheckIn ? t('tr_checkin_open') : t('tr_checkin_opens')}
              </span>
            </div>
          )}
          <div className="space-y-2">
            {regs.length===0 && <span className="text-sm text-white/40">—</span>}
            {regs.map(r=>{
              const isMine = user && (r.userId===user.id || (mine && mine.id===r.id))
              return (
                <div key={r.id} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/teams/${encodeURIComponent(r.team)}`} className="flex items-center gap-1.5 font-bold text-sm hover:text-amber-300 min-w-0">
                      {r.logo ? <img src={r.logo} alt="" loading="lazy" decoding="async" className="w-6 h-6 rounded-full object-cover bg-white shrink-0"/> : <span className="shrink-0">🛡️</span>}
                      <span className="truncate">{r.team}</span>
                    </Link>
                    <span className="ml-auto flex items-center gap-2 shrink-0">
                      {Array.isArray(r.roster) && r.roster.some(p=>p.name) && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 font-bold inline-flex items-center gap-1"><ShieldCheck size={11}/>{r.roster.filter(p=>p.name).length}</span>
                      )}
                      {r.checkedIn
                        ? <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black">✔ {t('tr_checked')}</span>
                        : <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 font-black">⏳ {t('tr_waiting')}</span>}
                      {(isMine || user?.isAdmin) && canCheckIn && (
                        <button onClick={()=>doCheckIn(r.id, !r.checkedIn)} disabled={ckBusy===r.id} className={`px-3 py-1 rounded-lg text-[11px] font-black disabled:opacity-60 ${r.checkedIn ? 'bg-white/10 hover:bg-white/15 text-white/80' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}`}>
                          {ckBusy===r.id ? '...' : r.checkedIn ? t('tr_checkin_cancel') : `✓ ${t('tr_check_in')}`}
                        </button>
                      )}
                    </span>
                  </div>
                  {Array.isArray(r.roster) && r.roster.some(p=>p.name) && (
                    <details className="mt-1.5">
                      <summary className="text-[11px] text-white/40 cursor-pointer hover:text-white/70 w-fit">Voir l’effectif</summary>
                      <div className="mt-1.5 grid sm:grid-cols-2 gap-1.5">
                        {r.roster.filter(p=>p.name).map((p,i)=>(
                          <div key={i} className="flex items-center gap-2 text-[11px] rounded-lg bg-black/30 border border-white/5 px-2 py-1.5 min-w-0">
                            <span className="text-[9px] font-black uppercase text-amber-300/70 w-16 shrink-0 truncate">{p.role}</span>
                            <span className="font-bold truncate">{p.name}</span>
                            {p.riot && <span className="text-white/35 truncate ml-auto">{p.riot}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
          {user && mine && !mine.checkedIn && tr.status!=='done' && (
            <p className="text-[11px] text-white/40 mt-2">
              {canCheckIn ? t('tr_checkin_hint') : `${t('tr_checkin_opens')}${checkinOpensAt ? ` (${new Date(checkinOpensAt).toLocaleString()})` : ''}.`}
            </p>
          )}
          {ckMsg && <p className={`text-[11px] mt-2 ${ckError ? 'text-red-300' : 'text-emerald-300'}`}>{ckMsg}</p>}
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
      {(openMatches.length>0 || trReports.length>0) && (
        <div className="mt-6 rounded-2xl border border-sky-400/25 bg-sky-400/[0.05] p-4">
          <h2 className="font-black flex items-center gap-2"><ClipboardList size={16} className="text-sky-300"/> Soumettre un score</h2>
          <p className="text-xs text-white/50 mt-1">Capitaines : envoyez le score avec l’ID du match Riot (LoL) pour vérification automatique. L’admin valide le résultat.</p>

          {user && openMatches.length>0 && (
            <form onSubmit={sendReport} className="mt-3 grid sm:grid-cols-2 gap-2.5">
              <select value={repKey} onChange={e=>{ setRepKey(e.target.value); setRepErr('') }}
                className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm">
                <option value="">— Choisir le match —</option>
                {openMatches.map(m=> (
                  <option key={`${m.ri}-${m.mi}`} value={`${m.ri}-${m.mi}`}>
                    Round {m.ri+1} : {m.teamA} vs {m.teamB}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" max="99" value={repA} onChange={e=>setRepA(e.target.value)}
                  placeholder={selectedMatch ? selectedMatch.teamA : 'Score A'}
                  className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <input type="number" min="0" max="99" value={repB} onChange={e=>setRepB(e.target.value)}
                  placeholder={selectedMatch ? selectedMatch.teamB : 'Score B'}
                  className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
              </div>
              <input value={repRiot} onChange={e=>setRepRiot(e.target.value)}
                placeholder="ID match Riot (ex: EUW1_1234567890)"
                className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
              <input value={repShot} onChange={e=>setRepShot(e.target.value)}
                placeholder="Lien screenshot (optionnel)" className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
              <input value={repNote} onChange={e=>setRepNote(e.target.value)}
                placeholder="Note pour l’admin (optionnel)" className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
              <button disabled={repBusy || !selectedMatch} className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-black disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Send size={14}/> {repBusy ? 'Envoi…' : 'Envoyer le score'}
              </button>
              {repErr && <p className="sm:col-span-2 text-xs text-red-300">{repErr}</p>}
              {repMsg && <p className="sm:col-span-2 text-xs text-emerald-300">{repMsg}</p>}
            </form>
          )}
          {user && openMatches.length===0 && trReports.length===0 && (
            <p className="mt-3 text-xs text-white/40">Aucun match ouvert à ton équipe pour le moment.</p>
          )}
          {!user && openMatches.length>0 && (
            <Link to="/login" state={{ from: `/tournaments/${tr.id}` }} className="inline-block mt-3 px-4 py-2.5 rounded-xl bg-sky-500 text-black text-sm font-black">Se connecter pour soumettre</Link>
          )}

          {trReports.length>0 && (
            <div className="mt-4">
              <div className="text-xs font-black text-white/50 uppercase tracking-wide mb-1.5">Derniers rapports</div>
              <div className="space-y-1.5">
                {trReports.map(r=> (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-black/25 border border-white/5 px-3 py-2 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded-full font-black border ${r.status==='approved' ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : r.status==='rejected' ? 'bg-red-500/15 border-red-500/35 text-red-300' : 'bg-amber-500/15 border-amber-500/35 text-amber-300'}`}>
                      {r.status==='approved'?'Validé':r.status==='rejected'?'Refusé':'En attente'}
                    </span>
                    <span className="font-bold truncate">{r.teamA} <span className="text-white/40">vs</span> {r.teamB}</span>
                    <span className="font-mono font-black">{r.scoreA} – {r.scoreB}</span>
                    {r.riotMatchId && <span className="text-white/35 truncate">Riot: {r.riotMatchId}</span>}
                    <span className="ml-auto text-white/35">{r.reporterName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
                  ? <img src={chosen.logo} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-xl object-cover bg-white"/>
                  : <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">🛡️</span>}
                <div className="min-w-0">
                  <div className="font-black text-sm truncate">{chosen?.name}</div>
                  <div className="text-xs text-white/50">🎮 {chosen?.game}{chosen?.captain ? ` • ${chosen.captain}` : ''}</div>
                </div>
              </div>
              {rosterBlocked && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
                  <div className="font-black flex items-center gap-1.5"><ShieldCheck size={13}/> Minimum 2 joueurs requis — {chosenRoster.starters}/5</div>
                  <p className="mt-1 text-amber-100/80">Ajoute au moins 2 joueurs à l’effectif de {chosen?.name} avant de t’inscrire.</p>
                  <Link to={`/teams/${encodeURIComponent(chosen?.name||'')}?tab=effectif`} className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-amber-400 text-black font-black">Compléter l’effectif →</Link>
                </div>
              )}
              {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</div>}
              <button onClick={submitOneClick} disabled={saving || !chosen || rosterBlocked} className="btn-shine w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black disabled:opacity-60">
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
