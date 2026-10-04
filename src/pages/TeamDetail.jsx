import { Link, useNavigate, useParams } from 'react-router-dom'
import { Shield, Trophy, Users, Send, Check, Swords, Target, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { computeStandings, getChampion } from '../lib/bracket'

export default function TeamDetail(){
  const { teamName } = useParams()
  const name = decodeURIComponent(teamName||'')
  const { regs, teams, tournaments, user, myJoinReqs, requestJoinTeam, updateTeamLogo, deleteTeam } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [msg, setMsg] = useState('')
  const [info, setInfo] = useState('')
  const [logoErr, setLogoErr] = useState('')

  const teamRegs = regs.filter(r=> (r.team||'').toLowerCase()===name.toLowerCase())
  const solo = teamRegs.length===0
    ? teams.find(x=> (x.name||'').toLowerCase()===name.toLowerCase())
    : null

  if(teamRegs.length===0 && !solo){
    return <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-white/60">{t('teams_empty')} <Link to="/teams" className="text-emerald-300">← {t('teams')}</Link></div>
  }

  // ---- Équipe standalone (créée directement, sans tournoi pour l'instant) ----
  if(solo){
    const mine = user && solo.userId===user.id
    const canDel = user && (user.isAdmin || mine)
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <Link to="/teams" className="text-sm text-white/60 hover:text-white">← {t('teams')}</Link>
        <div className="mt-4 rounded-3xl overflow-hidden bg-emerald-500/[0.06] border border-emerald-500/25 p-6">
          <div className="flex items-center gap-4">
            {solo.logo
              ? <img src={solo.logo} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white border border-white/20"/>
              : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl">🛡️</div>}
            <div>
              <h1 className="text-2xl md:text-4xl font-black">{solo.name}</h1>
              <div className="text-xs text-white/50 mt-1">🎮 {solo.game}{solo.captain && <> • {t('captain_ph')}: <b className="text-white/80">{solo.captain}</b></>}</div>
              {solo.description && <div className="text-sm text-white/60 mt-1">{solo.description}</div>}
            </div>
            <span className="ml-auto text-[11px] px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black shrink-0">{t('tc_new')}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/tournaments" className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center gap-2"><Trophy size={16}/> {t('tc_goto_tournaments')}</Link>
            {canDel && <button onClick={async ()=>{ if(window.confirm(t('tc_delete_q'))){ await deleteTeam(solo.id); nav('/teams') } }} className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold text-sm">{t('tc_delete')}</button>}
          </div>
          <p className="text-xs text-white/40 mt-4">{t('tc_no_tournament')}</p>
        </div>
      </div>
    )
  }
  const teamLogo = (teamRegs.find(r=> r.logo)||{}).logo || ''
  const myReg = user ? teamRegs.find(r=> r.userId===user.id) : null
  const canEditLogo = user && (user.isAdmin || !!myReg)
  const trById = Object.fromEntries(tournaments.map(x=> [x.id, x]))
  const myReqs = myJoinReqs()

  // ---- Stats agrégées ----
  let titles = 0, w = 0, l = 0
  const perTournament = teamRegs.map(r=>{
    const tr = trById[r.tournament_id]
    const bracket = tr?.bracket || []
    const st = computeStandings(bracket).find(s=> (s.team||'').toLowerCase()===name.toLowerCase())
    const champ = getChampion(bracket)
    const isChamp = champ && champ.toLowerCase()===name.toLowerCase()
    if(isChamp) titles += 1
    if(st){ w += st.w; l += st.l }
    return { reg: r, tr, st: st||{w:0,l:0,pts:0}, isChamp }
  })
  const pts = w * 3
  const games = w + l
  const winrate = games>0 ? Math.round((w/games)*100) : 0

  // ---- Historique matchs ----
  const history = []
  teamRegs.forEach(r=>{
    const tr = trById[r.tournament_id]
    ;(tr?.bracket||[]).forEach((rd, ri)=>{
      rd.matches.forEach(m=>{
        if(m.teamA?.toLowerCase()===name.toLowerCase() || m.teamB?.toLowerCase()===name.toLowerCase()){
          if(m.teamA && m.teamB && (m.scoreA!=null || m.scoreB!=null || m.winner)){
            history.push({ tr, round: ri, m })
          }
        }
      })
    })
  })

  const ask = async (r)=>{
    setInfo('')
    if(!user) return nav('/login', { state: { from: `/teams/${encodeURIComponent(name)}` } })
    try{
      await requestJoinTeam({ regId: r.id, tournamentId: r.tournament_id, message: msg })
      setInfo(t('teams_join_ok'))
    }catch(e){
      setInfo(e.message==='already' ? t('teams_join_already') : e.message==='ownteam' ? t('teams_join_own') : e.message==='need_sql' ? t('teams_need_sql') : t('teams_join_err'))
    }
  }

  const onLogoFile = (f)=>{
    setLogoErr(''); setInfo('')
    const target = myReg || (user?.isAdmin ? teamRegs[0] : null)
    if(!target) return
    if(!f) return
    if(!f.type.startsWith('image/')){ setLogoErr(t('team_logo_bad')); return }
    if(f.size > 5*1024*1024){ setLogoErr(t('team_logo_big')); return }
    const rd = new FileReader()
    rd.onload = ()=>{
      const img = new Image()
      img.onload = async ()=>{
        const max = 256
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width*s)); c.height = Math.max(1, Math.round(img.height*s))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        try{
          await updateTeamLogo(target.id, c.toDataURL('image/jpeg', 0.82))
          setInfo(t('team_logo_ok'))
        }catch(e){
          setLogoErr(e.message==='need_sql' ? t('teams_need_sql') : t('teams_join_err'))
        }
      }
      img.onerror = ()=> setLogoErr(t('team_logo_bad'))
      img.src = rd.result
    }
    rd.readAsDataURL(f)
  }

  const stat = (label, value, gold)=>{
    return <div className="rounded-2xl bg-black/30 border border-white/10 p-4 text-center">
      <div className={`text-3xl font-black ${gold?'text-emerald-300':''}`}>{value}</div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/teams" className="text-sm text-white/60 hover:text-white">← {t('teams')}</Link>

      <div className="mt-4 rounded-3xl overflow-hidden bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-4">
          <label className={`${canEditLogo?'cursor-pointer group/logo':''}`}>
            {teamLogo
              ? <img src={teamLogo} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white border border-white/20"/>
              : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl">🛡️</div>}
            {canEditLogo && <>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300 group-hover/logo:text-emerald-200"><Pencil size={11}/> {t('team_logo_change')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>{ onLogoFile(e.target.files?.[0]); e.target.value='' }}/>
            </>}
          </label>
          <div>
            <h1 className="text-2xl md:text-4xl font-black">{name}</h1>
            <div className="text-xs text-white/50 flex items-center gap-1 mt-1"><Users size={12}/> {t('teams_sub')}</div>
            {logoErr && <div className="text-xs text-red-400 mt-1">{logoErr}</div>}
          </div>
          {titles>0 && <div className="ml-auto text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black flex items-center gap-1"><Trophy size={12}/> {titles}x {t('champion')}</div>}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stat(t('team_participations'), perTournament.length)}
          {stat(t('team_titles'), titles, true)}
          {stat(t('wins'), w)}
          {stat(t('losses'), l)}
          {stat(t('team_winrate'), `${winrate}%`, true)}
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stat(t('pts'), pts, true)}
          {stat(t('team_matches'), games)}
          {stat(t('tr_participants'), `${teamRegs.length}`)}
        </div>
      </div>

      <h2 className="font-black mt-8 mb-3 flex items-center gap-2"><Shield size={16}/> {t('team_tournaments')}</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {perTournament.map(({reg, tr, st, isChamp})=>(
          <div key={reg.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="font-black">{tr ? <Link to={`/tournaments/${tr.id}`} className="hover:text-emerald-300">{tr.title}</Link> : reg.tournament_id}</div>
            <div className="text-xs text-white/50 mt-0.5">{tr?.game} • {tr?.prize} {isChamp && <span className="text-emerald-300 font-black">• 🏆 {t('champion')}</span>}</div>
            <div className="mt-2 flex gap-4 text-xs">
              <span><b className="text-emerald-300">{st.w}</b> {t('wins')}</span>
              <span><b className="text-red-300">{st.l}</b> {t('losses')}</span>
              <span><b className="text-emerald-300">{st.pts}</b> {t('pts')}</span>
            </div>
            {!myReqs.some(x=>x.regId===reg.id) && !(user && reg.userId===user.id) && (
              <button onClick={()=>ask(reg)} className="mt-3 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1"><Send size={12}/> {t('teams_join')}</button>
            )}
            {myReqs.some(x=>x.regId===reg.id) && <div className="mt-3 text-xs text-emerald-300 flex items-center gap-1"><Check size={12}/> {t('teams_join_sent')}</div>}
          </div>
        ))}
      </div>

      <h2 className="font-black mt-8 mb-3 flex items-center gap-2"><Swords size={16}/> {t('team_history')}</h2>
      <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/5">
        {history.length===0 && <div className="p-4 text-sm text-white/40">{t('team_no_matches')}</div>}
        {history.map((h,i)=>{
          const meFirst = h.m.teamA?.toLowerCase()===name.toLowerCase()
          const myScore = meFirst ? h.m.scoreA : h.m.scoreB
          const opScore = meFirst ? h.m.scoreB : h.m.scoreA
          const opp = meFirst ? h.m.teamB : h.m.teamA
          const won = h.m.winner?.toLowerCase()===name.toLowerCase()
          return (
            <div key={i} className="px-4 py-2.5 text-sm flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${won?'bg-emerald-400':'bg-red-400'}`}/>
              <span className="font-bold">{name}</span>
              <span className="font-black text-emerald-300">{myScore ?? '–'} : {opScore ?? '–'}</span>
              <Link to={`/teams/${encodeURIComponent(opp||'')}`} className="text-white/70 hover:text-white truncate">{opp}</Link>
              <span className="ml-auto text-xs text-white/40 truncate">{h.tr?.title}</span>
            </div>
          )
        })}
      </div>

      {info && <div className="mt-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-2.5">{info}</div>}
      {!user && (
        <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm text-white/60 flex items-center gap-2">
          <Target size={14}/> {t('tr_login_needed')}
          <Link to="/login" className="ml-auto px-3 py-1.5 rounded-xl bg-lime-400 text-black text-xs font-black">{t('login')}</Link>
        </div>
      )}
      {user && (
        <div className="mt-4 flex gap-2">
          <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder={t('teams_msg_ph')} className="flex-1 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/>
        </div>
      )}
    </div>
  )
}
