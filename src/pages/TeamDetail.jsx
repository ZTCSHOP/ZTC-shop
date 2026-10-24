import { Link, useNavigate, useParams } from 'react-router-dom'
import { Shield, Trophy, Users, Send, Check, Swords, Pencil, MapPin, Calendar, Globe, Plus, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { computeStandings, getChampion } from '../lib/bracket'
import { getTeamExtras, setTeamExtras } from '../lib/teamExtras'
import { reqDisplayName } from '../lib/names'
import { uploadImage } from '../lib/storage'
import { normalizeRoster, rosterStatus } from '../lib/roster'

const TABS = ['apercu', 'membres', 'effectif', 'tournois', 'stats', 'realisations']

export default function TeamDetail(){
  const { teamName } = useParams()
  const name = decodeURIComponent(teamName||'')
  const { regs, teams, tournaments, user, myJoinReqs, joinReqsFor, requestJoinTeam, updateJoinReq, updateTeamLogo, updateTeamInfo, saveTeamRoster, deleteTeam, allAccounts, teamAssets, teamInfos, saveTeamExtras, saveTeamAsset, profileAssets } = useAuth()
  const accounts = allAccounts()
  const assetOf = (uid)=> (uid && profileAssets[uid]) || {}
  const { t } = useLang()
  const nav = useNavigate()
  const [msg, setMsg] = useState('')
  const [joinMsg, setJoinMsg] = useState('')
  const [info, setInfo] = useState('')
  const [logoErr, setLogoErr] = useState('')
  const [editName, setEditName] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const [nameMsg, setNameMsg] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [tab, setTab] = useState(()=>{ try{ const q = new URLSearchParams(window.location.search).get('tab'); return TABS.includes(q) ? q : 'apercu' }catch{ return 'apercu' } })
  const [extras, setExtras] = useState(()=> getTeamExtras(name))
  const [editAbout, setEditAbout] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [editInfos, setEditInfos] = useState(false)
  const [locDraft, setLocDraft] = useState('')
  const [webDraft, setWebDraft] = useState('')
  const [discDraft, setDiscDraft] = useState('')
  const [ytDraft, setYtDraft] = useState('')
  const [igDraft, setIgDraft] = useState('')
  const [rosterDraft, setRosterDraft] = useState([])
  const [rosterMsg, setRosterMsg] = useState('')
  const [rosterSaving, setRosterSaving] = useState(false)
  useEffect(()=>{
    setExtras(getTeamExtras(name))
    const h = ()=> setExtras(getTeamExtras(name))
    window.addEventListener('ztc:team-extras', h)
    return ()=> window.removeEventListener('ztc:team-extras', h)
  }, [name])

  const teamRegs = regs.filter(r=> (r.team||'').toLowerCase()===name.toLowerCase())
  const solo = teamRegs.length===0
    ? teams.find(x=> (x.name||'').toLowerCase()===name.toLowerCase())
    : null
  const rosterTeamRow = teams.find(x=> (x.name||'').toLowerCase()===name.toLowerCase())
  const rosterGameInit = solo?.game || teamRegs[0]?.game || teamRegs[0]?.game_id || 'valorant'
  const rosterSource = (rosterTeamRow?.roster && rosterTeamRow.roster.length) ? rosterTeamRow.roster : ((teamRegs.find(r=> r.roster && r.roster.length)||{}).roster || [])
  const rosterKey = JSON.stringify(rosterSource)
  useEffect(()=>{ setRosterDraft(normalizeRoster(rosterSource, rosterGameInit)) }, [name, rosterKey])

  // Migration auto : les infos saisies AVANT les colonnes cloud restaient dans ce navigateur.
  // Dès que le capitaine ouvre sa page, on pousse ce qui manque pour que TOUT LE MONDE les voie.
  useEffect(()=>{
    const regList = regs.filter(r=> (r.team||'').toLowerCase()===name.toLowerCase())
    const soloT = regList.length===0 ? teams.find(x=> (x.name||'').toLowerCase()===name.toLowerCase()) : null
    const ownerId = soloT?.userId || regList[0]?.userId
    if(!user || !(user.isAdmin || user.id===ownerId)) return
    const local = getTeamExtras(name)
    const cloud = teamInfos[name.toLowerCase()] || {}
    const patch = {}
    ;['location','website','discord','youtube','instagram','about'].forEach(k=>{
      if(local[k] && !cloud[k]) patch[k] = local[k]
    })
    if(Object.keys(patch).length) saveTeamExtras(name, patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, regs, teams, name, teamInfos])

  if(teamRegs.length===0 && !solo){
    return <div className="max-w-[800px] mx-auto px-4 py-16 text-center text-white/60">{t('teams_empty')} <Link to="/teams" className="text-emerald-300">← {t('teams')}</Link></div>
  }

  const game = (solo?.game || teamRegs[0]?.game || teamRegs[0]?.game_id || 'valorant')
  const teamLogo = solo?.logo || (teamRegs.find(r=> r.logo)||{}).logo || ''
  const ownerId = solo?.userId || teamRegs[0]?.userId
  const isOwner = user && (user.isAdmin || user.id===ownerId)
  const ownerName = solo?.captain || teamRegs[0]?.captain || ''
  const founded = solo?.date || teamRegs[0]?.date
  const cloudInfo = teamInfos[name.toLowerCase()] || {}
  const about = extras.about || cloudInfo.about || solo?.description || ''
  const location = extras.location || cloudInfo.location || 'Tunisia'
  const website = extras.website || cloudInfo.website || ''
  const discord = extras.discord || cloudInfo.discord || ''
  const youtube = extras.youtube || cloudInfo.youtube || ''
  const instagram = extras.instagram || cloudInfo.instagram || ''
  // Bannière partagée (cloud, visible par tous) avec repli local
  const banner = teamAssets[name.toLowerCase()] || extras.banner || ''
  const trById = Object.fromEntries(tournaments.map(x=> [x.id, x]))
  const rosterInfo = rosterStatus(rosterDraft, game)
  const setSlot = (i, patch)=> setRosterDraft(list=> list.map((p, j)=> j===i ? { ...p, ...patch } : p))
  const saveRoster = async ()=>{
    if(!rosterTeamRow){ setRosterMsg('Équipe introuvable.'); return }
    setRosterSaving(true); setRosterMsg('')
    try{
      await saveTeamRoster(rosterTeamRow.id, rosterDraft)
      setRosterMsg('✓ Effectif enregistré')
    }catch(e){
      setRosterMsg(e.message==='need_sql' ? 'Exécute sprint3-sql.txt dans Supabase pour activer les effectifs.' : e.message==='login' ? 'Connexion requise.' : 'Erreur lors de l’enregistrement.')
    }finally{ setRosterSaving(false) }
  }
  const saveName = async (e)=>{
    e.preventDefault()
    if(!rosterTeamRow) return
    setNameSaving(true)
    setNameMsg('')
    try{
      const updated = await updateTeamInfo(rosterTeamRow.id, { name: nameDraft })
      setTeamExtras(updated.name, getTeamExtras(name))
      setEditName(false)
      nav(`/teams/${encodeURIComponent(updated.name)}`, { replace: true })
    }catch(err){
      setNameMsg(err.message==='taken'
        ? 'Ce nom est déjà utilisé par une autre équipe.'
        : err.message==='team_name'
          ? 'Le nom doit contenir au moins 2 caractères.'
          : 'Impossible de modifier le nom de l’équipe.')
    }finally{
      setNameSaving(false)
    }
  }

  // ---- Stats agrégées ----
  let titles = 0, w = 0, l = 0
  const champTitles = []
  const perTournament = teamRegs.map(r=>{
    const tr = trById[r.tournament_id]
    const bracket = tr?.bracket || []
    const st = computeStandings(bracket).find(s=> (s.team||'').toLowerCase()===name.toLowerCase())
    const champ = getChampion(bracket)
    const isChamp = champ && champ.toLowerCase()===name.toLowerCase()
    if(isChamp){ titles += 1; if(tr) champTitles.push(tr) }
    if(st){ w += st.w; l += st.l }
    return { reg: r, tr, st: st||{w:0,l:0,pts:0}, isChamp }
  })
  const pts = w * 3, games = w + l
  const winrate = games>0 ? Math.round((w/games)*100) : 0

  // ---- Membres : propriétaire + demandes acceptées ----
  const allReqs = teamRegs.flatMap(r=> joinReqsFor(r.id))
  const accepted = allReqs.filter(q=>q.status==='accepted')
  const pending = allReqs.filter(q=>q.status==='pending')
  const members = [{ name: ownerName||name, role: 'owner', uid: ownerId },
    ...accepted.map(q=> ({ name: reqDisplayName(q, accounts), role: 'member', reqId: q.id, date: q.date, uid: q.userId }))]
  const memberAvatar = (m)=> assetOf(m.uid).avatar || ''

  // ---- Historique matchs ----
  const history = []
  teamRegs.forEach(r=>{
    const tr = trById[r.tournament_id]
    ;(tr?.bracket||[]).forEach((rd, ri)=>{
      rd.matches.forEach(m=>{
        if(m.teamA?.toLowerCase()===name.toLowerCase() || m.teamB?.toLowerCase()===name.toLowerCase()){
          if(m.teamA && m.teamB && (m.scoreA!=null || m.scoreB!=null || m.winner)) history.push({ tr, round: ri, m })
        }
      })
    })
  })

  const myReg = user ? teamRegs.find(r=> r.userId===user.id) : null
  const canEditLogo = user && (user.isAdmin || !!myReg)
  const myReqs = myJoinReqs()
  const alreadyMember = user && (myReg || members.some(m=> m.uid===user.id))
  const alreadyRequested = user && myReqs.some(q=> q.status==='pending' && teamRegs.some(r=> r.id===q.regId))

  const ask = async (r)=>{
    setInfo('')
    if(!user) return nav('/login', { state: { from: `/teams/${encodeURIComponent(name)}` } })
    try{
      await requestJoinTeam({ regId: r.id, tournamentId: r.tournament_id, message: joinMsg })
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
          const url = await uploadImage(c.toDataURL('image/jpeg', 0.82), 'teams')
          await updateTeamLogo(target.id, url)
          setInfo(t('team_logo_ok'))
        }
        catch(e){ setLogoErr(e.message==='need_sql' ? t('teams_need_sql') : t('teams_join_err')) }
      }
      img.onerror = ()=> setLogoErr(t('team_logo_bad'))
      img.src = rd.result
    }
    rd.readAsDataURL(f)
  }

  const saveAbout = async ()=>{
    try{
      if(solo){ await updateTeamInfo(solo.id, { description: aboutDraft }) }
      else {
        setTeamExtras(name, { about: aboutDraft })
        try{ await saveTeamExtras(name, { about: aboutDraft }) }catch{}
      }
      setExtras(getTeamExtras(name)); setEditAbout(false); setInfo('✓')
    }catch{ setInfo(t('teams_join_err')) }
  }
  const saveInfos = async ()=>{
    const patch = { location: locDraft||'Tunisia', website: webDraft, discord: discDraft, youtube: ytDraft, instagram: igDraft }
    setTeamExtras(name, patch)
    try{ await saveTeamExtras(name, patch) }catch{}
    setExtras(getTeamExtras(name)); setEditInfos(false); setInfo('✓')
  }
  const onBannerFile = (f)=>{
    setInfo('')
    if(!f) return
    if(!f.type.startsWith('image/')){ setInfo(t('team_logo_bad')); return }
    if(f.size > 5*1024*1024){ setInfo(t('team_logo_big')); return }
    const rd = new FileReader()
    rd.onload = ()=>{
      const img = new Image()
      img.onload = async ()=>{
        const s = Math.min(1, 1280 / img.width, 400 / img.height)
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width*s)); c.height = Math.max(1, Math.round(img.height*s))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        const dataUrl = c.toDataURL('image/jpeg', 0.78)
        let url = dataUrl
        try{ url = await uploadImage(dataUrl, 'teams') }catch(e){ console.warn('team banner upload:', e) }
        try{
          console.log('Uploading team banner to cloud:', name)
          await saveTeamAsset(name, url)
          setTeamExtras(name, { banner: url })
          setExtras(getTeamExtras(name))
          setInfo('✓ ' + (t('pm_saved')||'Enregistré'))
        }catch(e){
          console.error('Team banner upload error:', e)
          setTeamExtras(name, { banner: url })
          setExtras(getTeamExtras(name))
          setInfo('✓ (Local) ' + (e.message || 'Erreur cloud'))
        }
      }
      img.onerror = ()=> setInfo(t('team_logo_bad'))
      img.src = rd.result
    }
    rd.readAsDataURL(f)
  }

  const copyInvite = async ()=>{
    try{ await navigator.clipboard.writeText(window.location.href); setInfo(t('team_link_copied')||'Lien copié ! Partage-le pour recruter.') }
    catch{ setInfo(window.location.href) }
  }

  const tabBtn = (id, label, badge)=> (
    <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab===id?'text-rose-400 border-rose-500':'text-white/50 border-transparent hover:text-white'}`}>
      {label}{badge!=null && badge>0 && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-white/10">{badge}</span>}
    </button>
  )

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-center gap-4">
        <Link to="/teams" className="text-sm text-white/60 hover:text-white">← {t('teams')}</Link>
        {isOwner && <Link to="/profile/myteam" className="text-sm text-white/60 hover:text-lime-300">← {t('dash_title')||'Mon Espace Membre'}</Link>}
      </div>

      {/* Bannière équipe */}
      <div className="mt-4 rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative">
        {banner
          ? <img src={banner} alt="" loading="lazy" decoding="async" className="w-full h-44 md:h-56 object-cover"/>
          : <div className="w-full h-28 md:h-36 flex items-center justify-center text-white/20 text-sm">1600 x 500</div>}
        {isOwner && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <label className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold hover:bg-black/80 cursor-pointer">⬆ Upload
              <input type="file" accept="image/*" className="hidden" onChange={e=>{ onBannerFile(e.target.files?.[0]); e.target.value='' }}/>
            </label>
            {banner && <button onClick={async()=>{ try{ await saveTeamAsset(name, '') }catch{} setTeamExtras(name, { banner: '' }); setExtras(getTeamExtras(name)); setInfo('✓') }} className="px-3 py-1.5 rounded-xl bg-black/60 border border-red-500/60 text-red-400 text-xs font-bold hover:bg-black/80">🗑 Remove</button>}
          </div>
        )}
      </div>

      {/* Header équipe */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex shrink-0 flex-col items-center">
          <label className={`${canEditLogo?'cursor-pointer group/logo':''}`}>
            {teamLogo
              ? <img src={teamLogo} alt="" loading="lazy" decoding="async" className="w-16 h-16 rounded-2xl object-cover bg-white border border-white/20"/>
              : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl">🛡️</div>}
            {canEditLogo && <>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300"><Pencil size={11}/></span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>{ onLogoFile(e.target.files?.[0]); e.target.value='' }}/>
            </>}
          </label>
          {isOwner && rosterTeamRow && (
            <button
              type="button"
              onClick={()=>{ setNameDraft(name); setNameMsg(''); setEditName(v=>!v) }}
              className="mt-1 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/20 px-1.5 py-1 text-[10px] font-bold text-white/65 hover:border-amber-400/40 hover:text-amber-300"
            >
              <Pencil size={10}/> Modifier
            </button>
          )}
        </div>
        <div>
          <h1 className="text-2xl md:text-4xl font-black">{name}</h1>
          <div className="text-xs text-white/50 mt-1">🎮 {game}{titles>0 && <span className="ml-2 text-amber-300 font-black">🏆 {titles}x {t('champion')}</span>}</div>
          {logoErr && <div className="text-xs text-red-400 mt-1">{logoErr}</div>}
        </div>
        {isOwner && solo && <button onClick={async ()=>{ if(window.confirm(t('tc_delete_q'))){ await deleteTeam(solo.id); nav('/teams') } }} className="ml-auto px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">{t('tc_delete')}</button>}
        {!isOwner && user && teamRegs.length>0 && !alreadyMember && !alreadyRequested && <button onClick={()=>ask(teamRegs[0])} className="ml-auto px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold">{t('teams_join')||'Rejoindre'}</button>}
      </div>
      {editName && isOwner && rosterTeamRow && (
        <form onSubmit={saveName} className="mt-3 max-w-xl rounded-2xl border border-amber-400/20 bg-[#141418] p-4">
          <label className="mb-2 block text-xs font-bold text-white/70">Nouveau nom d’équipe</label>
          <div className="flex flex-wrap gap-2">
            <input
              autoFocus
              required
              minLength={2}
              maxLength={40}
              value={nameDraft}
              onChange={e=>setNameDraft(e.target.value)}
              className="min-w-[180px] flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
              placeholder="Nom de l’équipe"
            />
            <button disabled={nameSaving} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black disabled:opacity-60">
              {nameSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={()=>setEditName(false)} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white/65 hover:text-white">Annuler</button>
          </div>
          {nameMsg && <p role="alert" className="mt-2 text-xs text-red-300">{nameMsg}</p>}
        </form>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-white/10">
        {tabBtn('apercu', t('team_tab_overview')||'Aperçu')}
        {tabBtn('membres', t('team_tab_members')||'Membres', members.length)}
        {tabBtn('effectif', 'Effectif', rosterInfo.starters < 5 ? rosterInfo.starters : null)}
        {tabBtn('tournois', t('team_tab_tournaments')||'Tournois', perTournament.length)}
        {tabBtn('stats', t('team_tab_stats')||'Statistiques')}
        {tabBtn('realisations', t('team_tab_achieve')||'Réalisations', titles||null)}
        <Link to={`/lfg?kind=team&game=${game}`} className="px-4 py-2.5 text-sm text-white/60 hover:text-amber-300 font-bold whitespace-nowrap">Opportunités</Link>
        <Link to={`/lfg?kind=player&game=${game}`} className="px-4 py-2.5 text-sm text-white/60 hover:text-amber-300 font-bold whitespace-nowrap">Recruter</Link>
      </div>

      <div className="mt-5 grid lg:grid-cols-[280px_1fr] gap-5 items-start">
        {/* Sidebar infos */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-center gap-3">
            {teamLogo
              ? <img src={teamLogo} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-xl object-cover bg-white"/>
              : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center">🎮</div>}
            <div className="font-black capitalize">{game}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="font-black text-sm">{t('team_infos')||"Infos de l'équipe"}</div>
              {isOwner && <button onClick={()=>{ setLocDraft(location); setWebDraft(website); setDiscDraft(discord); setYtDraft(youtube); setIgDraft(instagram); setEditInfos(!editInfos) }} className="text-white/40 hover:text-white"><Pencil size={13}/></button>}
            </div>
            {editInfos ? (
              <div className="mt-3 space-y-2">
                <input value={locDraft} onChange={e=>setLocDraft(e.target.value)} placeholder="Tunisia" className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <input value={webDraft} onChange={e=>setWebDraft(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <input value={discDraft} onChange={e=>setDiscDraft(e.target.value)} placeholder="discord.gg/..." className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <input value={ytDraft} onChange={e=>setYtDraft(e.target.value)} placeholder="youtube.com/..." className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <input value={igDraft} onChange={e=>setIgDraft(e.target.value)} placeholder="instagram.com/..." className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                <button onClick={saveInfos} className="w-full px-3 py-2 rounded-xl bg-emerald-500 text-black text-sm font-black">✓</button>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><MapPin size={15} className="text-rose-400 shrink-0"/><div><div className="text-[10px] text-white/40 font-black uppercase">Localisation</div><div className="font-bold">{location}</div></div></div>
                <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><Calendar size={15} className="text-rose-400 shrink-0"/><div><div className="text-[10px] text-white/40 font-black uppercase">Fondée</div><div className="font-bold">{founded ? new Date(founded).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—'}</div></div></div>
                <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><Globe size={15} className="text-rose-400 shrink-0"/><div className="min-w-0"><div className="text-[10px] text-white/40 font-black uppercase">{t('team_web')||'Site web'}</div><div className="font-bold truncate">{website ? <a href={website} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">{website}</a> : 'Aucun site web fourni'}</div></div></div>
                {discord && <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><ExternalLink size={15} className="text-blue-500 shrink-0"/><div className="min-w-0"><div className="text-[10px] text-white/40 font-black uppercase">{t('team_discord')||'Discord'}</div><div className="font-bold truncate"><a href={discord.startsWith('http')?discord:'https://'+discord} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">{discord}</a></div></div></div>}
                {youtube && <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><ExternalLink size={15} className="text-red-500 shrink-0"/><div className="min-w-0"><div className="text-[10px] text-white/40 font-black uppercase">{t('team_youtube')||'YouTube'}</div><div className="font-bold truncate"><a href={youtube.startsWith('http')?youtube:'https://'+youtube} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">{youtube}</a></div></div></div>}
                {instagram && <div className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-2.5"><ExternalLink size={15} className="text-pink-500 shrink-0"/><div className="min-w-0"><div className="text-[10px] text-white/40 font-black uppercase">{t('team_instagram')||'Instagram'}</div><div className="font-bold truncate"><a href={instagram.startsWith('http')?instagram:'https://'+instagram} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">{instagram}</a></div></div></div>}
              </div>
            )}
          </div>
        </div>

        {/* Contenu onglet */}
        <div className="min-w-0">
          {tab==='apercu' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-black text-lg">À propos</div>
                  {isOwner && <button onClick={()=>{ setAboutDraft(about); setEditAbout(!editAbout) }} className="text-white/40 hover:text-white"><Pencil size={14}/></button>}
                </div>
                {editAbout ? (
                  <div className="mt-2">
                    <textarea value={aboutDraft} onChange={e=>setAboutDraft(e.target.value)} rows="3" maxLength="500" className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"/>
                    <button onClick={saveAbout} className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-black">✓ {t('pm_save')||'Enregistrer'}</button>
                  </div>
                ) : <p className="text-sm text-white/70 mt-1 whitespace-pre-line">{about || 'WIN Esports tournament and go to the world champions'}</p>}
              </div>
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div><div className="font-black text-lg">Membres de l'équipe</div><div className="text-xs text-white/50">Effectif actuel de {members.length}+ joueurs</div></div>
                  {isOwner && <button onClick={copyInvite} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"><Plus size={13}/> Ajouter un membre</button>}
                </div>
                <div className="mt-3 space-y-2">
                  {members.slice(0,4).map((m,i)=>(
                    <div key={i} className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 flex items-center gap-3">
                      {memberAvatar(m)
                        ? <img src={memberAvatar(m)} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-full object-cover"/>
                        : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">{(m.name||'?')[0].toUpperCase()}</div>}
                      <div className="min-w-0"><div className="font-bold truncate flex items-center gap-2">
                        {m.uid ? <Link to={`/player/${m.uid}`} className="hover:text-emerald-300 hover:underline">{m.name}</Link> : m.name}
                        {m.role==='owner' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black">PROPRIÉTAIRE</span>}</div>
                        <div className="text-xs text-white/50">{m.role==='owner' ? (ownerName||m.name) : 'Membre'}</div></div>
                      <div className="ml-auto text-right text-xs"><div className="font-black">{winrate} % de victoires</div><div className="text-white/50">{games} matchs</div></div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setTab('membres')} className="mt-3 text-xs text-emerald-300 font-bold hover:underline">Voir tout →</button>
              </div>
            </div>
          )}

          {tab==='membres' && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="flex items-center justify-between">
                <div><div className="font-black text-lg">Membres de l'équipe</div><div className="text-xs text-white/50">Effectif actuel de {members.length}+ joueurs</div></div>
                {isOwner && <button onClick={copyInvite} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"><Plus size={13}/> Ajouter un membre</button>}
              </div>
              <div className="mt-3 space-y-2">
                {members.map((m,i)=>(
                  <div key={i} className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 flex items-center gap-3">
                    {memberAvatar(m)
                      ? <img src={memberAvatar(m)} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-full object-cover"/>
                      : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">{(m.name||'?')[0].toUpperCase()}</div>}
                    <div className="min-w-0 flex-1"><div className="font-bold truncate flex items-center gap-2">
                      {m.uid ? <Link to={`/player/${m.uid}`} className="hover:text-emerald-300 hover:underline">{m.name}</Link> : m.name}
                      {m.role==='owner'
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black">PROPRIÉTAIRE</span>
                        : <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black">MEMBRE</span>}</div>
                      <div className="text-xs text-white/50">{m.date ? `Rejoint le ${new Date(m.date).toLocaleDateString('fr-FR')}` : (ownerName||m.name)}</div></div>
                    <div className="text-right text-xs mr-1"><div className="font-black">{winrate} %</div><div className="text-white/50">{games} matchs</div></div>
                    {m.role==='member' && isOwner && <button onClick={()=>{ if(window.confirm(t('team_remove_q')||'Retirer ce joueur ?')) updateJoinReq(m.reqId,'rejected') }} className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-black">✕</button>}
                  </div>
                ))}
              </div>
          {user && (isOwner || members.some(m=> m.uid===user.id)) && (
            <div className="mt-4 rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs font-black mb-2">📥 {t('team_join_reqs')} ({pending.length})</div>
              {pending.length===0 && allReqs.length===0 && <div className="text-[11px] text-white/40">{t('team_no_reqs')}</div>}
              {pending.map(q=>(
                <div key={q.id} className="flex items-center gap-2 py-1.5 border-t border-white/5 first:border-0">
                  <div className="min-w-0 flex-1"><div className="text-xs font-bold truncate"><Link to={`/player/${q.userId}`} className="hover:text-emerald-300 hover:underline">{reqDisplayName(q, accounts)}</Link></div>
                      {q.message && <div className="text-[11px] text-white/50 truncate">{q.message}</div>}</div>
                  {isOwner && <>
                  <button onClick={()=>updateJoinReq(q.id,'accepted')} className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-black text-[11px] font-black">✓ {t('team_accept')}</button>
                  <button onClick={()=>updateJoinReq(q.id,'rejected')} className="px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-black">✕ {t('team_reject')}</button>
                  </>}
                </div>
              ))}
            </div>
          )}
              {!isOwner && teamRegs.filter(r=> !(user && r.userId===user.id) && !myReqs.some(x=> x.regId===r.id && x.status==='pending')).map(r=>(
                <div key={r.id} className="mt-3 flex gap-2">
                  <input value={joinMsg} onChange={e=>setJoinMsg(e.target.value)} placeholder={t('teams_msg_ph')} className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs"/>
                  <button onClick={()=>ask(r)} className="px-3 py-2 rounded-xl bg-emerald-500 text-black text-xs font-black flex items-center gap-1"><Send size={12}/> {t('teams_join')}</button>
                </div>
              ))}
            </div>
          )}

          {tab==='effectif' && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black text-lg">Effectif de tournoi</div>
                  <div className="text-xs text-white/50">Effectif facultatif pour l’inscription : le capitaine peut inscrire son équipe même seul.</div>
                </div>
                <div className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${rosterInfo.complete ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-200'}`}>
                  {rosterInfo.complete ? '✓ Effectif complet' : `${rosterInfo.starters}/5 titulaires`}
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${rosterInfo.complete ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, Math.round(rosterInfo.starters/5*100))}%` }}/>
              </div>

              {rosterTeamRow && rosterTeamRow.roster === null && (
                <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
                  Les effectifs ne sont pas encore activés. Exécute <code className="px-1.5 py-0.5 rounded bg-black/40">sprint3-sql.txt</code> dans Supabase → SQL Editor.
                </div>
              )}

              <div className="mt-4 space-y-2">
                {rosterDraft.map((p, i)=>(
                  <div key={i} className={`rounded-xl border p-3 ${p.sub ? 'bg-black/20 border-white/5' : 'bg-black/30 border-white/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${p.sub ? 'text-white/40' : 'text-amber-300/80'}`}>{p.role}</span>
                      {p.sub && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-bold">Remplaçant</span>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input value={p.name} onChange={e=>setSlot(i,{ name:e.target.value })} readOnly={!isOwner}
                        placeholder="Pseudo du joueur" maxLength={40}
                        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-amber-500 read-only:opacity-70"/>
                      <input value={p.riot} onChange={e=>setSlot(i,{ riot:e.target.value })} readOnly={!isOwner}
                        placeholder="Riot ID (Pseudo#TAG)" maxLength={60}
                        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-amber-500 read-only:opacity-70"/>
                    </div>
                  </div>
                ))}
              </div>
              {rosterMsg && <p className={`mt-3 text-xs font-bold ${rosterMsg.startsWith('✓') ? 'text-emerald-300' : 'text-amber-300'}`}>{rosterMsg}</p>}
              {isOwner ? (
                <button onClick={saveRoster} disabled={rosterSaving || (rosterTeamRow && rosterTeamRow.roster === null)} className="mt-4 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm disabled:opacity-60">
                  {rosterSaving ? 'Enregistrement...' : 'Enregistrer l’effectif'}
                </button>
              ) : (
                <p className="mt-4 text-xs text-white/40">Seul le capitaine peut modifier l’effectif.</p>
              )}
            </div>
          )}

          {tab==='tournois' && (
            <div className="grid md:grid-cols-2 gap-3">
              {perTournament.length===0 && <div className="text-sm text-white/40">{t('tc_no_tournament')}</div>}
              {perTournament.map(({reg, tr, st, isChamp})=>(
                <div key={reg.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="font-black">{tr ? <Link to={`/tournaments/${tr.id}`} className="hover:text-emerald-300">{tr.title}</Link> : reg.tournament_id}</div>
                  <div className="text-xs text-white/50 mt-0.5">{tr?.game} • {tr?.prize} {isChamp && <span className="text-emerald-300 font-black">• 🏆 {t('champion')}</span>}</div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span><b className="text-emerald-300">{st.w}</b> {t('wins')}</span>
                    <span><b className="text-red-300">{st.l}</b> {t('losses')}</span>
                    <span><b className="text-emerald-300">{st.pts}</b> {t('pts')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[[t('team_participations'), perTournament.length],[t('team_titles'), titles],[t('wins'), w],[t('losses'), l],[t('team_winrate'), `${winrate}%`]].map(([l,v],i)=>(
                  <div key={i} className="rounded-2xl bg-black/30 border border-white/10 p-4 text-center"><div className="text-2xl font-black text-emerald-300">{v}</div><div className="text-xs text-white/50 mt-1">{l}</div></div>
                ))}
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/5">
                <div className="px-4 py-2.5 font-black text-sm flex items-center gap-2"><Swords size={14}/> {t('team_history')}</div>
                {history.length===0 && <div className="p-4 text-sm text-white/40">{t('team_no_matches')}</div>}
                {history.map((h,i)=>{
                  const meFirst = h.m.teamA?.toLowerCase()===name.toLowerCase()
                  const won = h.m.winner?.toLowerCase()===name.toLowerCase()
                  return (
                    <div key={i} className="px-4 py-2.5 text-sm flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${won?'bg-emerald-400':'bg-red-400'}`}/>
                      <span className="font-bold">{name}</span>
                      <span className="font-black text-emerald-300">{(meFirst?h.m.scoreA:h.m.scoreB) ?? '–'} : {(meFirst?h.m.scoreB:h.m.scoreA) ?? '–'}</span>
                      <Link to={`/teams/${encodeURIComponent(meFirst?h.m.teamB:h.m.teamA||'')}`} className="text-white/70 hover:text-white truncate">{meFirst?h.m.teamB:h.m.teamA}</Link>
                      <span className="ml-auto text-xs text-white/40 truncate">{h.tr?.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab==='realisations' && (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="font-black text-lg flex items-center gap-2"><Trophy size={17} className="text-amber-300"/> {t('team_tab_achieve')||'Réalisations'}</div>
              {champTitles.length===0
                ? <div className="text-sm text-white/40 mt-2">Aucun titre pour le moment — WIN Esports tournament and go to the world champions 🏆</div>
                : <div className="mt-3 space-y-2">{champTitles.map(tr=>(
                    <Link key={tr.id} to={`/tournaments/${tr.id}`} className="block rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 hover:bg-amber-500/15">
                      <div className="font-black text-amber-300">🏆 Champion — {tr.title}</div>
                      <div className="text-xs text-white/50">{tr.game} • {tr.prize}</div>
                    </Link>
                  ))}</div>}
            </div>
          )}
        </div>
      </div>

      {info && <div className="mt-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-2.5">{info}</div>}
      {msg && <div className="mt-2 text-xs text-white/60">{msg}</div>}
    </div>
  )
}
