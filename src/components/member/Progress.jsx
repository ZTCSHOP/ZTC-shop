import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CheckCircle2, ChevronRight, Flame, Loader2, Lock, Sparkles, Target } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BADGES, BADGE_TIER, MISSIONS, STREAK_TARGET, isToday, todayKey } from '../../lib/missions'

function SqlBanner(){
  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
      <p className="font-black">Missions & badges pas encore activés</p>
      <p className="mt-1 text-amber-100/80">Exécute <code className="px-1.5 py-0.5 rounded bg-black/40">sprint2-sql.txt</code> dans Supabase → SQL Editor, puis recharge la page.</p>
    </div>
  )
}

export function DailyCheckin(){
  const { user, dailyCheckin, dailyClaims } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [earned, setEarned] = useState(0)
  if(!user) return null

  const streak = Number(user.streak || 0)
  const checkedToday = String(user.lastCheckin || '').slice(0,10) === todayKey() || dailyClaims.includes('login')
  const nextXp = 25 + Math.min(7, checkedToday ? streak : streak + 1) * 5

  const run = async ()=>{
    setBusy(true); setError(''); setEarned(0)
    try{
      const res = await dailyCheckin()
      if(res?.xp) setEarned(res.xp)
    }catch(e){ setError(e.message || 'Erreur') }
    finally{ setBusy(false) }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-400/[0.14] via-[#0b0c12]/80 to-[#0b0c12]/90 p-5">
      <Flame className="absolute -right-6 -top-6 w-36 h-36 text-amber-400/10" strokeWidth={1.4}/>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-300/80">Série de connexion</p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
            <Flame size={22} className="text-amber-300"/> {streak} jour{streak > 1 ? 's' : ''}
            <span className="text-white/30">/ {STREAK_TARGET}</span>
          </h2>
          <p className="mt-1 text-sm text-white/55">Reviens chaque jour : le bonus augmente jusqu’à +35 XP.</p>
        </div>
        <button onClick={run} disabled={busy || checkedToday}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition ${checkedToday ? 'bg-white/10 text-white/40 cursor-default' : 'bg-amber-400 text-black hover:bg-amber-300'}`}>
          {busy ? <Loader2 size={16} className="animate-spin"/> : checkedToday ? <CheckCircle2 size={16}/> : <Sparkles size={16}/>}
          {checkedToday ? 'Déjà récupéré' : `Check-in +${nextXp} XP`}
        </button>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: STREAK_TARGET }).map((_, i)=>(
          <div key={i} title={`Jour ${i+1}`} className={`flex-1 h-2 rounded-full ${i < Math.min(streak, STREAK_TARGET) ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-white/10'}`}/>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      {earned > 0 && <p className="mt-3 text-xs font-bold text-emerald-300">+{earned} XP ajoutés à ton compte.</p>}
    </div>
  )
}

export function MissionsPanel(){
  const { user, myOrders, myRegs, dailyClaims, claimMission, progressReady } = useAuth()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)
  if(!user) return null

  const orders = myOrders()
  const regs = myRegs()
  const todayOrders = orders.filter(o=> isToday(o.date)).length
  const todayRegs = regs.filter(r=> isToday(r.date)).length
  const done = {
    login: dailyClaims.includes('login'),
    order: dailyClaims.includes('order'),
    reg: dailyClaims.includes('reg'),
  }
  const eligible = {
    login: true,
    order: todayOrders > 0,
    reg: todayRegs > 0,
  }
  const counts = { login: null, order: todayOrders, reg: todayRegs }

  const claim = async (code)=>{
    setBusy(code); setMsg(null)
    try{
      const res = await claimMission(code)
      if(res?.ok) setMsg({ ok: true, text: `+${res.xp} XP récupérés !` })
      else setMsg({ ok: false, text: res?.reason === 'claimed' ? 'Déjà récupéré aujourd’hui.' : 'Mission pas encore terminée.' })
    }catch(e){ setMsg({ ok: false, text: e.message || 'Erreur' }) }
    finally{ setBusy('') }
  }

  return (
    <div className="grid gap-4">
      {!progressReady && <SqlBanner/>}
      <div className="grid sm:grid-cols-3 gap-3">
        {MISSIONS.map(m=>{
          const claimed = done[m.code]
          const ready = !claimed && eligible[m.code]
          const count = counts[m.code]
          return (
            <div key={m.code} className={`rounded-2xl border p-4 flex flex-col ${claimed ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-white/10 bg-[#0b0c12]/70'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${claimed ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/60'}`}>
                  {claimed ? <CheckCircle2 size={17}/> : <Target size={17}/>}
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-200">+{m.xp} XP{m.bonus ? '+' : ''}</span>
              </div>
              <h3 className="mt-3 font-black text-sm leading-tight">{m.title}</h3>
              <p className="mt-1 text-[12px] text-white/50 leading-snug flex-1">{m.desc}</p>
              <div className="mt-3 flex items-center gap-2">
                {m.code === 'login' ? (
                  <Link to="/profile" className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1">
                    {claimed ? 'Série validée' : 'Faire le check-in'} <ChevronRight size={13}/>
                  </Link>
                ) : claimed ? (
                  <span className="text-xs font-bold text-emerald-300">Récupéré</span>
                ) : ready ? (
                  <button onClick={()=>claim(m.code)} disabled={!!busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 text-black text-xs font-black hover:bg-amber-300">
                    {busy===m.code ? <Loader2 size={13} className="animate-spin"/> : <Sparkles size={13}/>} Récupérer
                  </button>
                ) : (
                  <span className="text-xs text-white/40 inline-flex items-center gap-1"><Lock size={12}/> {count != null ? `${count}/1 aujourd’hui` : 'À faire'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {msg && <p className={`text-xs font-bold ${msg.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{msg.text}</p>}
      <div className="rounded-2xl border border-white/10 bg-[#0b0c12]/60 p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-white/60">Envie de plus d’XP ? Le barème complet est ici.</span>
        <Link to="/profile/xp" className="font-black text-amber-300 hover:text-amber-200 inline-flex items-center gap-1">XP & Récompenses <ChevronRight size={14}/></Link>
      </div>
    </div>
  )
}

export function BadgesPanel(){
  const { user, badges, progressReady } = useAuth()
  if(!user) return null
  const unlocked = new Set(badges)
  const pct = Math.round((unlocked.size / BADGES.length) * 100)

  return (
    <div className="grid gap-4">
      {!progressReady && <SqlBanner/>}
      <div className="rounded-2xl border border-white/10 bg-[#0b0c12]/70 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-black flex items-center gap-2"><Award size={16} className="text-amber-300"/> {unlocked.size} / {BADGES.length} badges</span>
          <span className="text-white/50">{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700" style={{ width: `${pct}%` }}/>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map(b=>{
          const got = unlocked.has(b.code)
          return (
            <div key={b.code} className={`rounded-2xl border p-4 text-center transition bg-[#0b0c12]/85 ${got ? BADGE_TIER[b.tier] : 'border-white/10 text-white/55'}`}>
              <div className={`text-3xl ${got ? '' : 'grayscale opacity-60'}`}>{b.emoji}</div>
              <div className="mt-2 font-black text-sm leading-tight">{b.title}</div>
              <div className="mt-0.5 text-[11px] opacity-70">{b.desc}</div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-wide">
                {got ? 'Débloqué' : <span className="inline-flex items-center gap-1"><Lock size={10}/> Verrouillé</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
