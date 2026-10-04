import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Users, Send, Check, Trophy, Medal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { computeStandings, getChampion } from '../lib/bracket'

export default function Teams(){
  const { regs, tournaments, user, joinReqsFor, myJoinReqs, requestJoinTeam, updateJoinReq } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [msg, setMsg] = useState({}) // regId -> message texte
  const [info, setInfo] = useState('')
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('teams') // teams | ranking

  const trById = Object.fromEntries(tournaments.map(x=> [x.id, x]))
  const myReqs = myJoinReqs()
  const reqFor = (regId)=> myReqs.find(x=> x.regId===regId)

  const visible = regs.filter(r=>{
    if(filter==='all') return true
    return r.tournament_id===filter
  }).sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))

  const ask = async (r)=>{
    setInfo('')
    if(!user) return nav('/login', { state: { from: '/teams' } })
    try{
      await requestJoinTeam({ regId: r.id, tournamentId: r.tournament_id, message: msg[r.id]||'' })
      setInfo(t('teams_join_ok'))
    }catch(e){
      setInfo(e.message==='already' ? t('teams_join_already') : e.message==='ownteam' ? t('teams_join_own') : e.message==='need_sql' ? t('teams_need_sql') : t('teams_join_err'))
    }
  }

  // ---- Classement général : agrégé sur tous les tournois ----
  const board = (()=>{
    const map = new Map()
    const get = (name, logo)=>{
      const k = (name || '').toLowerCase()
      if(!map.has(k)) map.set(k, { team: name, logo: logo || '', parts: 0, titles: 0, w: 0, l: 0 })
      const e = map.get(k)
      if(logo && !e.logo) e.logo = logo
      return e
    }
    regs.forEach(r=>{ get(r.team, r.logo).parts += 1 })
    tournaments.forEach(tr=>{
      const bracket = tr?.bracket || []
      if(!bracket.length) return
      computeStandings(bracket).forEach(s=>{
        const e = map.get((s.team || '').toLowerCase())
        if(e){ e.w += s.w; e.l += s.l }
      })
      const champ = getChampion(bracket)
      if(champ){
        const e = map.get(champ.toLowerCase())
        if(e) e.titles += 1
      }
    })
    return [...map.values()]
      .map(e=>{
        const games = e.w + e.l
        return { ...e, pts: e.w * 3, winrate: games > 0 ? Math.round((e.w / games) * 100) : 0 }
      })
      .sort((a, b)=> b.titles - a.titles || b.pts - a.pts || b.winrate - a.winrate)
  })()

  const medal = (i)=> i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><Shield className="text-amber-400"/> {t('teams')}</h1>
      <p className="text-sm text-white/60 mt-1">{t('teams_sub')}</p>

      {/* Tabs Équipes / Classement */}
      <div className="mt-4 flex gap-2">
        <button onClick={()=>setTab('teams')} className={`text-xs px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 ${tab==='teams'?'bg-amber-500 text-black border-amber-500':'bg-white/5 border-white/10 text-white/70'}`}><Shield size={13}/> {t('teams')}</button>
        <button onClick={()=>setTab('ranking')} className={`text-xs px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 ${tab==='ranking'?'bg-amber-500 text-black border-amber-500':'bg-white/5 border-white/10 text-white/70'}`}><Trophy size={13}/> {t('ranking')}</button>
      </div>

      {tab==='ranking' ? (
      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="grid grid-cols-[52px_1fr_52px_52px_52px_56px] sm:grid-cols-[64px_1fr_70px_70px_60px_60px_70px] items-center gap-1 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/40 border-b border-white/10">
          <span>{t('rk_rank')}</span><span>{t('rk_team')}</span>
          <span className="text-center hidden sm:block">{t('team_participations')}</span>
          <span className="text-center" title={t('team_titles')}>🏆</span>
          <span className="text-center">W-L</span>
          <span className="text-center">%</span>
          <span className="text-center text-amber-300">{t('pts')}</span>
        </div>
        {board.length===0 && <div className="p-4 text-sm text-white/40">{t('teams_empty')}</div>}
        {board.map((e,i)=>(
          <div key={e.team} className={`grid grid-cols-[52px_1fr_52px_52px_52px_56px] sm:grid-cols-[64px_1fr_70px_70px_60px_60px_70px] items-center gap-1 px-3 py-2.5 text-sm border-b border-white/5 last:border-0 ${i<3?'bg-amber-500/[0.06]':''}`}>
            <span className="font-black text-base">{medal(i)}</span>
            <Link to={`/teams/${encodeURIComponent(e.team)}`} className="flex items-center gap-2 font-bold truncate hover:text-amber-300">
              {e.logo
                ? <img src={e.logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-white border border-white/10 shrink-0"/>
                : <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">🛡️</span>}
              <span className="truncate">{e.team}</span>
              {e.titles>0 && <Medal size={13} className="text-amber-300 shrink-0"/>}
            </Link>
            <span className="text-center text-white/60 hidden sm:block">{e.parts}</span>
            <span className="text-center font-black text-amber-300">{e.titles}</span>
            <span className="text-center text-white/70">{e.w}-{e.l}</span>
            <span className="text-center text-white/60">{e.winrate}%</span>
            <span className="text-center font-black text-amber-300">{e.pts}</span>
          </div>
        ))}
      </div>
      ) : (
      <>
      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={()=>setFilter('all')} className={`text-xs px-3 py-1.5 rounded-full border ${filter==='all'?'bg-amber-500 text-black font-black border-amber-500':'bg-white/5 border-white/10 text-white/70'}`}>{t('teams_all')}</button>
        {tournaments.filter(x=>x.status!=='pending').map(x=>(
          <button key={x.id} onClick={()=>setFilter(x.id)} className={`text-xs px-3 py-1.5 rounded-full border ${filter===x.id?'bg-amber-500 text-black font-black border-amber-500':'bg-white/5 border-white/10 text-white/70'}`}>{x.title}</button>
        ))}
      </div>

      {info && <div className="mt-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-2.5">{info}</div>}

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {visible.length===0 && <div className="text-sm text-white/40">{t('teams_empty')}</div>}
        {visible.map(r=>{
          const tr = trById[r.tournament_id]
          const mine = user && r.userId===user.id
          const already = reqFor(r.id)
          const incoming = mine ? joinReqsFor(r.id).filter(x=>x.status==='pending') : []
          return (
            <div key={r.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2">
                {r.logo
                  ? <img src={r.logo} alt="" className="w-9 h-9 rounded-xl object-cover bg-white border border-white/10"/>
                  : <span className="text-lg w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">🛡️</span>}
                <Link to={`/teams/${encodeURIComponent(r.team)}`} className="font-black truncate hover:text-amber-300">{r.team}</Link>
                {mine && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">{t('teams_mine')}</span>}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {tr ? <Link to={`/tournaments/${tr.id}`} className="text-amber-300 hover:underline">{tr.title}</Link> : r.tournament_id}
                {r.captain && <> • {t('captain_ph')}: <b className="text-white/80">{r.captain}</b></>}
              </div>
              <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1"><Users size={12}/> {incoming.length>0 ? `${incoming.length} ${t('teams_requests')}` : t('teams_open_spots')}</div>

              {!mine && !already && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={msg[r.id]||''}
                    onChange={e=>setMsg({...msg, [r.id]: e.target.value})}
                    placeholder={t('teams_msg_ph')}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={()=>ask(r)} className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1"><Send size={12}/> {t('teams_join')}</button>
                </div>
              )}
              {already && <div className="mt-3 text-xs text-emerald-300 flex items-center gap-1"><Check size={12}/> {t('teams_join_sent')} ({already.status})</div>}

              {mine && incoming.length>0 && (
                <div className="mt-3 space-y-1.5">
                  {joinReqsFor(r.id).map(q=>(
                    <div key={q.id} className="text-xs flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-2.5 py-1.5">
                      <span className="font-bold">{q.userName||q.userId?.slice(0,8)}</span>
                      <span className="text-white/50 truncate">{q.message}</span>
                      <span className="ml-auto text-white/40">{q.status}</span>
                      {q.status==='pending' && (
                        <>
                          <button onClick={()=>updateJoinReq(q.id,'accepted')} className="px-2 py-0.5 rounded-lg bg-emerald-500 text-black font-bold">✓</button>
                          <button onClick={()=>updateJoinReq(q.id,'rejected')} className="px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 font-bold">✕</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </>
      )}
    </div>
  )
}
