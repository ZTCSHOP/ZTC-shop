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
  social_follow: 'Abonnement aux réseaux sociaux',
  purchase: 'Achat sur le site',
  wallet_topup: 'Recharge wallet (30 DT+)',
}

const STATUS = {
  pending: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', Icon: Clock },
  approved: { label: 'Validé', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 },
  rejected: { label: 'Refusé', cls: 'bg-red-500/15 text-red-300 border-red-500/30', Icon: XCircle },
}

const claimError = (e)=>{
  const msg = String(e?.message || '')
  const code = String(e?.code || '')
  if(/not enough xp/i.test(msg)) return 'Il te manque encore de l’XP pour ce palier.'
  if(code === 'PGRST202' || /Could not find the function|claim_reward|schema cache/i.test(msg))
    return 'La base XP n’est pas encore activée. Exécute xp-system-sql.txt dans Supabase, puis réessaie.'
  if(code === '42501' || /permission denied/i.test(msg))
    return 'Permission refusée : vérifie les droits de la fonction claim_reward.'
  if(/auth required|login/i.test(msg)) return 'Connecte-toi avec un compte cloud pour réclamer.'
  return msg || 'Impossible de réclamer pour le moment.'
}

export default function XpRewards(){
  const { user, cloud, xpLogs, rewardClaims, claimReward, inviteLink } = useAuth()
  const { t } = useLang()
  const [busy, setBusy] = useState(null)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const [reveal, setReveal] = useState(null) // { reward, phase:'anim'|'result', result }

  if(!user) return null
  const xp = Number(user.xp || 0)
  const { level, cur, need } = levelProgress(xp)
  const pct = Math.min(100, Math.round((cur / need) * 100))
  const myClaims = rewardClaims.filter(c=> c.user_id === user.id)

  const copyLink = async ()=>{
    try{ await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(()=>setCopied(false), 2000) }catch{}
  }

  const claim = async (reward)=>{
    if(busy) return
    setErr('')
    setBusy(reward.tier)
    setReveal({ reward, phase: 'anim', result: null })
    const req = claimReward(reward.tier)
      .then(row => ({ ok: true, row }))
      .catch(e => ({ ok: false, message: claimError(e) }))
    const [res] = await Promise.all([req, new Promise(done => setTimeout(done, 3000))])
    setReveal(v => v ? { ...v, phase: 'result', result: res } : v)
    setBusy(null)
    if(!res.ok) setErr(res.message)
  }

  const closeReveal = ()=> setReveal(null)

  return (
    <div id="xp" className="mt-6 rounded-3xl bg-gradient-to-br from-lime-500/10 to-royal-500/5 border border-lime-500/20 p-5 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-black flex items-center gap-2"><Sparkles size={17} className="text-lime-300"/> {t('xp_title') || 'XP & Récompenses'}</h2>
        <span className="text-xs font-black text-black bg-gradient-to-r from-lime-300 to-lime-500 rounded-full px-3 py-1 shadow-[0_0_18px_-4px_rgba(230,187,70,.9)]">Niveau {level}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>{xp.toLocaleString('fr-FR')} XP au total</span>
        <span className="font-bold text-lime-200">{cur} / {need} XP</span>
      </div>
      <div className="mt-1 h-2.5 rounded-full bg-white/10 xp-track border border-white/5">
        <div className="h-full rounded-full xp-fill" style={{ width: `${pct}%` }}/>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-2">
        {REWARDS.map(r=>{
          const activeClaim = myClaims.find(c=> c.tier === r.tier)
          const st = activeClaim ? STATUS[activeClaim.status] || STATUS.pending : null
          const reached = xp >= r.xp
          const canClaim = !activeClaim || activeClaim.status === 'rejected'
          return (
            <div key={r.tier} className={`rounded-2xl border p-3 transition-colors ${reached ? 'border-lime-500/40 bg-black/30' : 'border-white/10 bg-black/20 opacity-70'}`}>
              <div className="text-2xl">{r.emoji}</div>
              <div className="text-xs font-bold mt-1">{t(r.key) || r.label}</div>
              <div className="text-[11px] text-white/50">{r.xp.toLocaleString('fr-FR')} XP requis</div>
              <div className={`text-[10px] font-bold ${r.cost > 0 ? 'text-lime-300/90' : 'text-emerald-300/80'}`}>
                {r.cost > 0 ? `− ${r.cost.toLocaleString('fr-FR')} XP` : 'Gratuit en XP'}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5 leading-snug break-words">{r.prize}</div>
              <div className="mt-2 space-y-1.5">
                {st && <span className={`inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2 py-1 ${st.cls}`}><st.Icon size={12}/> {st.label}</span>}
                {canClaim && (reached
                  ? <button disabled={!cloud || busy===r.tier} onClick={()=>claim(r)} className="w-full text-[11px] font-black rounded-full px-2 py-1.5 bg-gradient-to-r from-lime-300 to-lime-500 hover:from-lime-200 hover:to-lime-400 text-black shadow-[0_0_16px_-4px_rgba(230,187,70,.9)] disabled:opacity-50">
                      {busy===r.tier ? 'Ouverture…' : (activeClaim ? 'Réessayer' : 'Réclamer')}
                    </button>
                  : <span className="text-[11px] text-white/40">🔒 encore {(r.xp - xp).toLocaleString('fr-FR')} XP</span>)}
              </div>
            </div>
          )
        })}
      </div>
      {err && <div className="mt-2 text-[11px] text-red-300">{err}</div>}
      <p className="mt-2 text-[11px] text-white/40">Demande validée manuellement par l’admin. L’XP du palier est débité à la réclamation et remboursé si la demande est refusée.</p>

      {cloud && inviteLink && (
        <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3">
          <div className="text-xs font-bold flex items-center gap-1.5"><Gift size={14} className="text-lime-300"/> {t('xp_invite') || 'Invite un ami → +50 XP'}</div>
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
                    <b className="text-lime-300">+{l.xp} XP</b>
                  </span>
                </div>
              ))}
            </div>}
      </div>

      {reveal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={()=>{ if(reveal.phase === 'result') closeReveal() }}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-lime-500/40 bg-gradient-to-br from-[#1c1229] to-[#0c0a12] p-6 text-center shadow-[0_0_80px_-10px_rgba(168,85,247,.85)] pop-in"
            onClick={e=> e.stopPropagation()}
          >
            {reveal.phase === 'anim' ? (
              <>
                <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-lime-400/60 ring-spin"/>
                  <div className="absolute inset-2 rounded-full border border-lime-300/30"/>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-lime-500/25 to-royal-500/15 gift-glow">
                    <span className="text-4xl gift-float">{reveal.reward.emoji}</span>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-black">Ouverture du cadeau…</h3>
                <p className="mt-1 text-xs text-white/60">{reveal.reward.label}</p>
                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 claim-bar"/>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-white/35">3 secondes</p>
              </>
            ) : (
              <>
                {reveal.result.ok ? (
                  <>
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-500/25 to-royal-500/15 gift-glow"/>
                      <span className="text-5xl gift-float">{reveal.reward.emoji}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black bg-gradient-to-r from-lime-200 to-lime-400 bg-clip-text text-transparent">Bravo !</h3>
                    <p className="mt-1 text-sm font-bold text-white">{reveal.reward.label}</p>
                    <p className="mt-1 text-xs text-white/60">{reveal.reward.prize}</p>
                    {reveal.reward.cost > 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-[11px] font-bold text-lime-200">
                        − {reveal.reward.cost.toLocaleString('fr-FR')} XP
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-white/45">Nouveau solde : {xp.toLocaleString('fr-FR')} XP</p>
                    <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                      {reveal.result.row?.status === 'approved'
                        ? 'Récompense déjà validée ✅'
                        : 'Demande envoyée à l’admin — en attente de validation.'}
                    </div>
                    <button onClick={closeReveal} className="mt-4 w-full rounded-full bg-gradient-to-r from-lime-300 to-lime-500 px-4 py-2.5 text-sm font-black text-black hover:from-lime-200 hover:to-lime-400">Super !</button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-4xl">😕</div>
                    <h3 className="mt-4 text-lg font-black text-red-200">Réclamation impossible</h3>
                    <p className="mt-1 text-xs text-white/60">{reveal.result.message}</p>
                    <button onClick={closeReveal} className="mt-4 w-full rounded-full bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/20">Fermer</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
