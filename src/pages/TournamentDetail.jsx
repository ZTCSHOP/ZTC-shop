import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Trophy, Calendar, Users, Gift, Ticket, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import BracketView from '../components/BracketView'
import { computeStandings } from '../lib/bracket'

export default function TournamentDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const { tournaments, regsFor, myRegs, registerTournament, user } = useAuth()
  const { t } = useLang()
  const tr = tournaments.find(x=> x.id===id)
  const [form, setForm] = useState({ team:'', captain:'', phone:'', gameId:'', logo:'' })
  const [logoErr, setLogoErr] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if(!tr) return <div className="max-w-[800px] mx-auto px-4 py-16 text-center">{t('no_result')} <Link to="/tournaments" className="text-amber-300">← {t('tournaments')}</Link></div>

  const regs = regsFor(tr.id)
  const full = regs.length >= (tr.max_teams||16)
  const mine = user ? regs.find(r=> r.userId===user.id) : myRegs().find(r=> r.tournament_id===tr.id)
  const canRegister = tr.status==='open' && !full && !mine

  const submit = async (e)=>{
    e.preventDefault(); setError('')
    if(!user) return nav('/login', { state: { from: `/tournaments/${tr.id}` } })
    try{
      await registerTournament({ tournamentId: tr.id, team: form.team, captain: form.captain, phone: form.phone, gameId: form.gameId, logo: form.logo })
      setDone(true)
    }catch(err){
      const m = err.message||''
      setError(
        m==='phone' ? 'Téléphone invalide (8-15 chiffres)'
        : m==='team' ? t('team_ph')
        : m.includes('foreign key') ? t('tr_need_sync')
        : m
      )
    }
  }

  const onLogoFile = (f)=>{
    setLogoErr('')
    if(!f) return
    if(!f.type.startsWith('image/')){ setLogoErr(t('team_logo_bad')); return }
    if(f.size > 5*1024*1024){ setLogoErr(t('team_logo_big')); return }
    const rd = new FileReader()
    rd.onload = ()=>{
      const img = new Image()
      img.onload = ()=>{
        const max = 256
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width*s)); c.height = Math.max(1, Math.round(img.height*s))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        setForm(prev=> ({...prev, logo: c.toDataURL('image/jpeg', 0.82)}))
      }
      img.onerror = ()=> setLogoErr(t('team_logo_bad'))
      img.src = rd.result
    }
    rd.readAsDataURL(f)
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link to="/tournaments" className="text-sm text-white/60 hover:text-white">← {t('tournaments')}</Link>
      <div className="mt-4 rounded-3xl overflow-hidden bg-white/5 border border-white/10">
        <div className="relative h-56 md:h-72">
          <img src={tr.image} alt={tr.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs font-black text-amber-400 uppercase tracking-widest">{tr.game} • {tr.status==='open'?t('tr_open'):tr.status==='done'?t('tr_done'):t('tr_soon')}</div>
            <h1 className="text-2xl md:text-4xl font-black">{tr.title}</h1>
          </div>
        </div>
        <div className="p-5 grid sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Calendar size={12}/> Date</div><div className="font-bold mt-0.5">{tr.date ? new Date(tr.date).toLocaleString() : '—'}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Gift size={12}/> {t('tr_prize')}</div><div className="font-bold mt-0.5 text-amber-300">{tr.prize||'—'}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Users size={12}/> {t('tr_slots')}</div><div className="font-bold mt-0.5">{regs.length}/{tr.max_teams||16}</div></div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3"><div className="text-white/50 text-xs flex items-center gap-1"><Ticket size={12}/> {t('tr_entry')}</div><div className="font-bold mt-0.5">{Number(tr.entry_fee)>0 ? `${tr.entry_fee} TND` : t('tr_free')}</div></div>
        </div>
      </div>

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
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 h-fit">
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
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <h3 className="font-black">{t('tr_register')}</h3>
              <input placeholder={t('team_ph')} value={form.team} onChange={e=>setForm({...form,team:e.target.value})} className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-amber-500"/>
              <input placeholder={t('captain_ph')} value={form.captain} onChange={e=>setForm({...form,captain:e.target.value})} className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-amber-500"/>
              <input placeholder={t('phone_ph')} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-amber-500"/>
              <input placeholder={t('gameid_ph')} value={form.gameId} onChange={e=>setForm({...form,gameId:e.target.value})} className="w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-amber-500"/>
              <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 hover:border-amber-500">
                {form.logo
                  ? <img src={form.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white"/>
                  : <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">🛡️</span>}
                <span className="text-xs text-white/60">{form.logo ? t('team_logo_ok') : t('team_logo_ph')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e=>onLogoFile(e.target.files?.[0])}/>
              </label>
              {logoErr && <div className="text-xs text-red-400">{logoErr}</div>}
              {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">{error}</div>}
              <button className="btn-shine w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black">{t('tr_register')}</button>
              {!user && <p className="text-[11px] text-white/40 text-center">{t('tr_login_needed')}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
