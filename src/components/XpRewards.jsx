import { useState } from 'react'
import { Gift, Sparkles, Copy, Check, Send, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { levelProgress, REWARDS } from '../lib/level'

const ACTION_LABEL = {
  tournament_reg: 'Inscription tournoi',
  team_create: 'Création d’équipe',
  avatar_update: 'Changement d’avatar',
  checkin: 'Check-in tournoi',
  referral: 'Parrainage',
}

const STATUS = {
  pending: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', Icon: Clock },
  approved: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 },
  rejected: { label: 'Refusé', cls: 'bg-red-500/15 text-red-300 border-red-500/30', Icon: XCircle },
}

export default function XpRewards(){
  const { user, cloud, xpLogs, rewardClaims, claimReward, inviteLink } = useAuth()
  const { t } = useLang()
  const [busy, setBusy] = useState(null)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')

  if(!user) return null
  const xp = Number(user.xp || 0)
  const { level, cur, need } = levelProgress(xp)
  const pct = Math.min(100, Math.round((cur / need) * 100))
  const myClaims = rewardClaims.filter(c=> c.user_id === user.id)

  const copyLink = async ()=>{
    try{ await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(()=>setCopied(false), 2000) }catch{}
  }

  const claim = async (tier)=>{
    setErr('')
    setBusy(tier)
    try{ await claimReward(tier) }
    catch(e){ setErr(e.message === 'not enough xp' ? 'Il te manque encore de l’XP pour ce palier.' : (e.message || 'Erreur')) }
    finally{ setBusy(null) }
  }

  return (
    <div id="xp" className="mt-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 p-5 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-black flex items-center gap-2"><Sparkles size={17} className="text-purple-300"/> {t('xp_title') || 'XP & Récompenses'}</h2>
        <span className="text-xs font-bold text-purple-200 bg-purple-500/15 border border-purple-500/30 rounded-full px-3 py-1">Niveau {level}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>{xp.toLocaleString('fr-FR')} XP au total</span>
        <span>{cur} / {need} XP</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${pct}%` }}/>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-2">
        {REWARDS.map(r=>{
          const claim = myClaims.find(c=> c.tier === r.tier)
          const reached = xp >= r.xp
          const st = claim ? STATUS[claim.status] || STATUS.pending : null
          return (
            <div key={r.tier} className={`rounded-2xl border p-3 ${reached ? 'border-purple-500/40 bg-black/30' : 'border-white/10 bg-black/20 opacity-70'}`}>
              <div className="text-2xl">{r.emoji}</div>
              <div className="text-xs font-bold mt-1">{t(r.key) || `Palier ${r.xp.toLocaleString('fr-FR')} XP`}</div>
              <div className="text-[11px] text-white/50">{r.xp.toLocaleString('fr-FR')} XP</div>
              <div className="mt-2">
                {st
                  ? <span className={`inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2 py-1 ${st.cls}`}><st.Icon size={12}/> {st.label}</span>
                  : reached
                    ? <button disabled={!cloud || busy===r.tier} onClick={()=>claim(r.tier)} className="w-full text-[11px] font-black rounded-full px-2 py-1.5 bg-purple-500 hover:bg-purple-400 text-black disabled:opacity-50">
                        {busy===r.tier ? '...' : 'Réclamer'}
                      </button>
                    : <span className="text-[11px] text-white/40">🔒 encore {(r.xp - xp).toLocaleString('fr-FR')} XP</span>}
              </div>
            </div>
          )
        })}
      </div>
      {err && <div className="mt-2 text-[11px] text-red-300">{err}</div>}
      <p className="mt-2 text-[11px] text-white/40">Une demande envoyée est validée manuellement par l’admin.</p>

      {cloud && inviteLink && (
        <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3">
          <div className="text-xs font-bold flex items-center gap-1.5"><Gift size={14} className="text-pink-300"/> {t('xp_invite') || 'Invite un ami → +50 XP'}</div>
          <div className="mt-2 flex gap-2">
            <input readOnly value={inviteLink} className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white/70"/>
            <button onClick={copyLink} className="px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1">{copied ? <Check size={13}/> : <Copy size={13}/>}</button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs font-bold text-white/70 flex items-center gap-1.5"><Send size={13}/> Historique</div>
        {xpLogs.length === 0
          ? <div className="text-[11px] text-white/40 mt-1">Aucune activité XP pour le moment.</div>
          : <div className="mt-2 space-y-1 max-h-48 overflow-auto pr-1">
              {xpLogs.map(l=>(
                <div key={l.id} className="flex items-center justify-between text-[11px] rounded-lg bg-black/20 border border-white/5 px-2 py-1.5">
                  <span className="text-white/70">{ACTION_LABEL[l.action] || l.action}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-white/35">{new Date(l.created_at).toLocaleDateString('fr-FR')}</span>
                    <b className="text-purple-300">+{l.xp} XP</b>
                  </span>
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
