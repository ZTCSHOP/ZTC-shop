import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Users, Send, Check, Trophy, Medal, Plus, Trash2, Gamepad2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { computeStandings, getChampion } from '../lib/bracket'

const TEAM_GAMES = ['valorant', 'lol', 'cs2', 'fc27', 'tekken8', 'other']

function fileToLogo(file){
  return new Promise((resolve, reject)=>{
    if(!file) return resolve('')
    if(!file.type.startsWith('image/')) return reject(new Error('bad'))
    if(file.size > 5*1024*1024) return reject(new Error('big'))
    const rd = new FileReader()
    rd.onload = ()=>{
      const img = new Image()
      img.onload = ()=>{
        const max = 256
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width*s)); c.height = Math.max(1, Math.round(img.height*s))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = ()=> reject(new Error('bad'))
      img.src = rd.result
    }
    rd.onerror = ()=> reject(new Error('bad'))
    rd.readAsDataURL(file)
  })
}

export default function Teams(){
  const { regs, teams, tournaments, user, joinReqsFor, myJoinReqs, requestJoinTeam, updateJoinReq, createTeam, deleteTeam } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [msg, setMsg] = useState({}) // regId -> message texte
  const [info, setInfo] = useState('')
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('teams') // teams | ranking | create
  // ---- formulaire création ----
  const [fname, setFname] = useState('')
  const [fgame, setFgame] = useState('valorant')
  const [flogo, setFlogo] = useState('')
  const [fphone, setFphone] = useState('')
  const [fdesc, setFdesc] = useState('')
  const [ferr, setFerr] = useState('')
  const [creating, setCreating] = useState(false)

  const trById = Object.fromEntries(tournaments.map(x=> [x.id, x]))
  const myReqs = myJoinReqs()
  const reqFor = (regId)=> myReqs.find(x=> x.regId===regId)

  const visible = regs.filter(r=>{
    if(filter==='all') return true
    return r.tournament_id===filter
  }).sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))

  // Équipes standalone (créées directement) : visibles avec le filtre "all"
  const standalone = filter==='all'
    ? [...teams].sort((a,b)=> new Date(b.date||0) - new Date(a.date||0))
    : []

  const doCreate = async (e)=>{
    e.preventDefault()
    setFerr(''); setInfo('')
    if(!user) return nav('/login', { state: { from: '/teams' } })
    setCreating(true)
    try{
      await createTeam({ name: fname, game: fgame, logo: flogo, phone: fphone, description: fdesc })
      setFname(''); setFlogo(''); setFphone(''); setFdesc(''); setFgame('valorant')
      setInfo(t('tc_ok'))
      setTab('teams')
    }catch(err){
      setFerr(err.message==='taken' ? t('tc_taken') : err.message==='login' ? t('tc_need_login') : err.message==='need_sql' ? t('tc_need_sql') : t('teams_join_err'))
    }finally{
      setCreating(false)
    }
  }

  const rmTeam = async (id)=>{
    if(!window.confirm(t('tc_delete_q'))) return
    try{ await deleteTeam(id); setInfo(t('tc_deleted')) }
    catch{ setInfo(t('teams_join_err')) }
  }

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
    // équipes standalone : présentes au classement même sans tournoi
    teams.forEach(x=>{ get(x.name, x.logo) })
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
      <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><Shield className="text-emerald-400"/> {t('teams')}</h1>
      <p className="text-sm text-white/60 mt-1">{t('teams_sub')}</p>

      {/* Tabs Équipes / Classement / Créer */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={()=>setTab('teams')} className={`text-xs px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 ${tab==='teams'?'bg-emerald-500 text-black border-emerald-500':'bg-white/5 border-white/10 text-white/70'}`}><Shield size={13}/> {t('teams')}</button>
        <button onClick={()=>setTab('ranking')} className={`text-xs px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 ${tab==='ranking'?'bg-emerald-500 text-black border-emerald-500':'bg-white/5 border-white/10 text-white/70'}`}><Trophy size={13}/> {t('ranking')}</button>
        <button onClick={()=>setTab('create')} className={`text-xs px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 ${tab==='create'?'bg-emerald-500 text-black border-emerald-500':'bg-white/5 border-white/10 text-white/70'}`}><Plus size={13}/> {t('tab_create')}</button>
      </div>

      {tab==='create' ? (
      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-5 max-w-[640px]">
        <h2 className="font-black flex items-center gap-2"><Gamepad2 size={17} className="text-emerald-400"/> {t('tc_title')}</h2>
        <p className="text-xs text-white/50 mt-1">{t('tc_sub')}</p>
        {!user ? (
          <div className="mt-4 rounded-xl bg-black/30 border border-white/10 p-4 text-sm text-white/60 flex items-center gap-2">
            {t('tc_need_login')}
            <Link to="/login" state={{ from: '/teams' }} className="ml-auto px-3 py-1.5 rounded-xl bg-lime-400 text-black text-xs font-black">{t('login')}</Link>
          </div>
        ) : (
        <form onSubmit={doCreate} className="mt-3">
          <label className="block text-[13px] font-bold mt-3 mb-1.5 text-white/80">{t('tc_name')} *</label>
          <input value={fname} onChange={e=>setFname(e.target.value)} placeholder={t('tc_name_ph')} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/>
          <div className="grid sm:grid-cols-2 gap-x-3">
            <div>
              <label className="block text-[13px] font-bold mt-3 mb-1.5 text-white/80">{t('tc_game')} *</label>
              <select value={fgame} onChange={e=>setFgame(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500">
                {TEAM_GAMES.map(g=> <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold mt-3 mb-1.5 text-white/80">{t('rec_phone')}</label>
              <input value={fphone} onChange={e=>setFphone(e.target.value)} placeholder={t('phone_ph')} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>
          </div>
          <label className="block text-[13px] font-bold mt-3 mb-1.5 text-white/80">{t('tc_logo')}</label>
          <div className="flex items-center gap-3">
            {flogo
              ? <img src={flogo} alt="" className="w-12 h-12 rounded-xl object-cover bg-white border border-white/10"/>
              : <span className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">🛡️</span>}
            <input type="file" accept="image/*" onChange={async e=>{
              setFerr('')
              try{ setFlogo(await fileToLogo(e.target.files?.[0])) }
              catch(err){ setFerr(err.message==='big' ? t('team_logo_big') : t('team_logo_bad')) }
              e.target.value = ''
            }} className="text-xs text-white/60 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-emerald-500 file:text-black file:text-xs file:font-black"/>
          </div>
          <label className="block text-[13px] font-bold mt-3 mb-1.5 text-white/80">{t('tc_desc')}</label>
          <textarea value={fdesc} onChange={e=>setFdesc(e.target.value)} rows="2" placeholder={t('tc_desc_ph')} className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"/>
          {ferr && <div className="mt-3 text-xs text-red-400">{ferr}</div>}
          <button type="submit" disabled={creating} className="mt-4 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm disabled:opacity-60 flex items-center gap-2">
            <Plus size={16}/> {creating ? '...' : t('tc_submit')}
          </button>
        </form>
        )}
      </div>
      ) : tab==='ranking' ? (
      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="grid grid-cols-[52px_1fr_52px_52px_52px_56px] sm:grid-cols-[64px_1fr_70px_70px_60px_60px_70px] items-center gap-1 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/40 border-b border-white/10">
          <span>{t('rk_rank')}</span><span>{t('rk_team')}</span>
          <span className="text-center hidden sm:block">{t('team_participations')}</span>
          <span className="text-center" title={t('team_titles')}>🏆</span>
          <span className="text-center">W-L</span>
          <span className="text-center">%</span>
          <span className="text-center text-emerald-300">{t('pts')}</span>
        </div>
        {board.length===0 && <div className="p-4 text-sm text-white/40">{t('teams_empty')}</div>}
        {board.map((e,i)=>(
          <div key={e.team} className={`grid grid-cols-[52px_1fr_52px_52px_52px_56px] sm:grid-cols-[64px_1fr_70px_70px_60px_60px_70px] items-center gap-1 px-3 py-2.5 text-sm border-b border-white/5 last:border-0 ${i<3?'bg-emerald-500/[0.06]':''}`}>
            <span className="font-black text-base">{medal(i)}</span>
            <Link to={`/teams/${encodeURIComponent(e.team)}`} className="flex items-center gap-2 font-bold truncate hover:text-emerald-300">
              {e.logo
                ? <img src={e.logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-white border border-white/10 shrink-0"/>
                : <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">🛡️</span>}
              <span className="truncate">{e.team}</span>
              {e.titles>0 && <Medal size={13} className="text-emerald-300 shrink-0"/>}
            </Link>
            <span className="text-center text-white/60 hidden sm:block">{e.parts}</span>
            <span className="text-center font-black text-emerald-300">{e.titles}</span>
            <span className="text-center text-white/70">{e.w}-{e.l}</span>
            <span className="text-center text-white/60">{e.winrate}%</span>
            <span className="text-center font-black text-emerald-300">{e.pts}</span>
          </div>
        ))}
      </div>
      ) : (
      <>
      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={()=>setFilter('all')} className={`text-xs px-3 py-1.5 rounded-full border ${filter==='all'?'bg-emerald-500 text-black font-black border-emerald-500':'bg-white/5 border-white/10 text-white/70'}`}>{t('teams_all')}</button>
        {tournaments.filter(x=>x.status!=='pending').map(x=>(
          <button key={x.id} onClick={()=>setFilter(x.id)} className={`text-xs px-3 py-1.5 rounded-full border ${filter===x.id?'bg-emerald-500 text-black font-black border-emerald-500':'bg-white/5 border-white/10 text-white/70'}`}>{x.title}</button>
        ))}
      </div>

      {info && <div className="mt-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-2.5">{info}</div>}

      <div className="mt-4 grid md:grid-cols-2 gap-3">
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
                <Link to={`/teams/${encodeURIComponent(r.team)}`} className="font-black truncate hover:text-emerald-300">{r.team}</Link>
                {mine && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">{t('teams_mine')}</span>}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {tr ? <Link to={`/tournaments/${tr.id}`} className="text-emerald-300 hover:underline">{tr.title}</Link> : r.tournament_id}
                {r.captain && <> • {t('captain_ph')}: <b className="text-white/80">{r.captain}</b></>}
              </div>
              <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1"><Users size={12}/> {incoming.length>0 ? `${incoming.length} ${t('teams_requests')}` : t('teams_open_spots')}</div>

              {!mine && !already && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={msg[r.id]||''}
                    onChange={e=>setMsg({...msg, [r.id]: e.target.value})}
                    placeholder={t('teams_msg_ph')}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button onClick={()=>ask(r)} className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1"><Send size={12}/> {t('teams_join')}</button>
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
        {standalone.map(x=>{
          const mine = user && x.userId===user.id
          const canDel = user && (user.isAdmin || mine)
          return (
            <div key={'st-'+x.id} className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 p-4">
              <div className="flex items-center gap-2">
                {x.logo
                  ? <img src={x.logo} alt="" className="w-9 h-9 rounded-xl object-cover bg-white border border-white/10"/>
                  : <span className="text-lg w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">🛡️</span>}
                <Link to={`/teams/${encodeURIComponent(x.name)}`} className="font-black truncate hover:text-emerald-300">{x.name}</Link>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">{t('tc_new')}</span>
              </div>
              <div className="text-xs text-white/50 mt-1">
                🎮 {x.game}{x.captain && <> • {t('captain_ph')}: <b className="text-white/80">{x.captain}</b></>}
              </div>
              {x.description && <div className="text-xs text-white/40 mt-1 line-clamp-2">{x.description}</div>}
              <div className="mt-3 flex gap-2">
                <Link to="/tournaments" className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center gap-1"><Trophy size={12}/> {t('tc_goto_tournaments')}</Link>
                {canDel && <button onClick={()=>rmTeam(x.id)} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"><Trash2 size={12}/></button>}
              </div>
            </div>
          )
        })}
        {visible.length===0 && standalone.length===0 && <div className="text-sm text-white/40">{t('teams_empty')}</div>}
      </div>
      </>
      )}
    </div>
  )
}
