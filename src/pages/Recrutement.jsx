import { useState } from 'react'
import { Gamepad2, Send, CheckCircle2, AlertTriangle, Copy, Plus } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase, isCloudEnabled } from '../lib/supabase'

const WEBHOOK = import.meta.env.VITE_DISCORD_RECRUTEMENT_WEBHOOK ||
  'https://discord.com/api/webhooks/1555575933853896855/FrBhS6dX93fbP30VPXdlyD1An_WYAu8j5rSV1it2YfHkhnMEStOfffIRc32dA0Sw3X3Q'

const GAMES = [
  { id: 'VALORANT', icon: '🎯', ranks: ['Silver-Gold', 'Platinum-Diamond', 'Immortal', 'Radiant'],
    roles: ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'],
    trackerPh: 'https://tracker.gg/valorant/...' },
  { id: 'LEAGUE OF LEGENDS', icon: '⚔️', ranks: ['Platinum', 'Diamond', 'Master+', 'Challenger'],
    roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'], champs: true,
    trackerPh: 'https://op.gg/...' },
  { id: 'CS2', icon: '💣', rankFree: true, rankPh: 'Ex: Faceit 10 - 2500 ELO',
    roles: ['Entry', 'AWP', 'IGL', 'Support', 'Rifler'],
    trackerPh: 'https://faceit.com/...' },
  { id: 'EA FC 27', icon: '⚽', modes: ['Ultimate Team', 'Clubs', 'Kick-Off compétitif'],
    gameIdPh: 'Ex: ZTC_Ahmed_TN', palmares: true },
  { id: 'TEKKEN 8', icon: '👊',
    ranks: ['1st-10th Dan', 'Mighty Ruler', 'Flame Ruler', 'Battle Ruler', 'Fujin', 'Raijin', 'Kishin', 'Bushin', 'Tekken King', 'Tekken Emperor', 'Tekken God+'],
    mains: ['Jin', 'Kazuya', 'Heihachi', 'Reina', 'Paul', 'Law', 'King', 'Nina', 'Hwoarang', 'Devil Jin', 'Yoshimitsu', 'Dragunov', 'Feng', 'Lars', 'Alisa', 'Xiaoyu', 'Asuka', 'Lili', 'Shaheen', 'Claudio', 'Leo', 'Steve', 'Bryan', 'Jack-8', 'Kuma / Panda', 'Lee', 'Leroy', 'Zafina', 'Raven', 'Victor', 'Azucena', 'Autre'],
    gameIdPh: 'Ex: ZTC_Kazuya_TN', palmares: true },
]

const inputCls = 'w-full px-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-red-500 text-sm'
const labelCls = 'block text-[13px] font-bold mt-4 mb-1.5 text-white/80'

export default function Recrutement(){
  const { t } = useLang()
  const { user } = useAuth()
  const [game, setGame] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null) // {d, ok, err}
  const cfg = GAMES.find(g => g.id === game)

  const submit = async (e)=>{
    e.preventDefault()
    if(!game){ alert(t('rec_choose_game')); return }
    setSending(true)
    const fd = new FormData(e.target)
    const d = Object.fromEntries(fd.entries())
    d.jeu = game
    d.date = new Date().toLocaleString('fr-TN')
    const rank = d.rank || d.mode || '-'
    const role = d.role || d.main || d.champs || '-'
    const tracker = d.tracker || d.gameid || '-'

    // 1) Supabase (best effort — la page marche même sans base)
    if(isCloudEnabled){
      try{
        await supabase.from('applications').insert({
          user_id: user?.id || null, game, pseudo: d.pseudo, nom: d.nom || null,
          age: d.age ? Number(d.age) : null, phone: d.phone, discord: d.discord,
          email: d.email, ville: d.ville || null, rank, role, tracker,
          extra: { champs: d.champs || null, palmares: d.palmares || null },
          experience: d.experience || null, dispo: d.dispo, motivation: d.motivation,
          video: d.video || null,
        })
      }catch(err){ console.warn('applications insert:', err?.message) }
    }

    // 2) Discord webhook (même format que la page standalone)
    const embed = {
      title: '🔥 NOUVELLE CANDIDATURE — ZTC-Esports',
      color: 14713344,
      fields: [
        { name: '🎮 Pseudo', value: String(d.pseudo || '-').slice(0, 100), inline: true },
        { name: '🎯 Jeu', value: String(game).slice(0, 100), inline: true },
        { name: '🏆 Rank', value: String(rank).slice(0, 100), inline: true },
        { name: '🛡 Rôle', value: String(role).slice(0, 100), inline: true },
        { name: '👤 Age / Ville', value: `${d.age || '-'} ans — ${d.ville || '-'}`.slice(0, 100), inline: true },
        { name: '📞 Tel', value: String(d.phone || '-').slice(0, 100), inline: true },
        { name: '💬 Discord', value: String(d.discord || '-').slice(0, 100), inline: false },
        { name: '📧 Email', value: String(d.email || '-').slice(0, 100), inline: true },
        { name: '🔗 Tracker', value: String(tracker).slice(0, 300), inline: false },
        { name: '🎓 Expérience', value: String(d.experience || '-').slice(0, 500), inline: false },
        { name: '📅 Dispo', value: String(d.dispo || '-').slice(0, 100), inline: true },
        { name: '🎬 Vidéo', value: String(d.video || '-').slice(0, 300), inline: false },
        { name: '💪 Motivation', value: String(d.motivation || '-').slice(0, 1000), inline: false },
      ],
      footer: { text: 'ZTC-Esports • ' + d.date },
      timestamp: new Date().toISOString(),
    }
    let ok = false, err = ''
    try{
      const r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'ZTC Recrutement', embeds: [embed] }) })
      ok = r.ok
      if(!r.ok) err = 'Discord: ' + r.status
    }catch(ex){ err = ex.message }
    setSending(false)
    setDone({ d: { ...d, rank, role }, ok, err })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyCand = ()=>{
    if(!done) return
    const { d } = done
    navigator.clipboard.writeText(`ZTC Candidature - ${d.pseudo} (${d.jeu}) - ${d.age}ans - ${d.phone} - Discord:${d.discord} - Tracker:${d.tracker || d.gameid || '-'} - Dispo:${d.dispo} - Motiv:${d.motivation}`)
    alert(t('rec_copied'))
  }

  if(done){
    const { d, ok, err } = done
    return (
      <div className="max-w-[760px] mx-auto px-4 py-14 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-black mt-4">{t('rec_ok_t')}</h1>
        <p className="text-white/60 mt-2"><b className="text-white">{d.pseudo}</b> — {d.jeu} • {d.rank} {d.role}<br />{t('rec_ok_d')} <b className="text-white">{d.discord}</b></p>
        <p className={`mt-3 text-sm font-bold flex items-center justify-center gap-2 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {ok ? <><CheckCircle2 size={16} /> {t('rec_discord_ok')}</> : <><AlertTriangle size={16} /> {t('rec_discord_ko')} ({err})</>}
        </p>
        <div className="mt-6 space-y-3">
          <button onClick={copyCand} className="w-full py-3.5 rounded-xl bg-white text-black font-black flex items-center justify-center gap-2"><Copy size={17} /> {t('rec_copy')}</button>
          <button onClick={()=>{ setDone(null); setGame('') }} className="w-full py-3.5 rounded-xl bg-white/5 border border-white/15 font-bold flex items-center justify-center gap-2"><Plus size={17} /> {t('rec_new')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/15 border border-red-600/40 text-red-300 text-sm font-black">
          <Gamepad2 size={16} /> {t('rec_badge')}
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-4">🔥 {t('rec_title')}</h1>
        <p className="text-white/60 mt-3 max-w-2xl mx-auto">{t('rec_sub')}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
        {GAMES.map(g => (
          <button key={g.id} type="button" onClick={()=>setGame(g.id)}
            className={`text-left rounded-2xl p-4 border transition ${game === g.id ? 'bg-red-600 border-red-500' : 'bg-white/[0.04] border-white/10 hover:border-red-500/50'}`}>
            <div className="font-black">{g.icon} {g.id}</div>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 rounded-3xl bg-white/[0.04] border border-white/10 p-5 md:p-7">
        <div className="rounded-xl bg-red-950/40 border border-red-800/40 p-4 text-[13px] leading-relaxed text-red-100/90">
          <b>📋 {t('rec_exig_t')}</b><br />
          • {t('rec_exig_1')}<br />• {t('rec_exig_2')}<br />• {t('rec_exig_3')}
        </div>

        <div className="grid sm:grid-cols-2 gap-x-3">
          <div><label className={labelCls}>{t('rec_pseudo')} *</label><input name="pseudo" required placeholder="Ex: ZTC_Shadow" className={inputCls} /></div>
          <div><label className={labelCls}>{t('rec_nom')}</label><input name="nom" placeholder="Ex: Ahmed Ben Ali" className={inputCls} /></div>
          <div><label className={labelCls}>{t('rec_age')} *</label><input name="age" type="number" min="13" max="40" required placeholder="Ex: 19" className={inputCls} /></div>
          <div><label className={labelCls}>{t('rec_phone')} *</label><input name="phone" required placeholder="Ex: 20 123 456" className={inputCls} /></div>
          <div><label className={labelCls}>{t('rec_discord')} *</label><input name="discord" required placeholder="Ex: shadow#1234" className={inputCls} /></div>
          <div><label className={labelCls}>{t('rec_email')} *</label><input name="email" type="email" required placeholder="ton@email.com" className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>{t('rec_ville')}</label><input name="ville" placeholder="Ex: Tunis, Sfax, Sousse..." className={inputCls} /></div>

        <div><label className={labelCls}>{t('rec_game')} *</label>
          <div className="flex flex-wrap gap-2">
            {GAMES.map(g => (
              <button key={g.id} type="button" onClick={()=>setGame(g.id)}
                className={`px-4 py-2.5 rounded-full text-[13px] font-bold border ${game === g.id ? 'bg-red-600 border-red-500' : 'bg-black/20 border-white/10 hover:bg-white/10'}`}>
                {g.icon} {g.id}
              </button>
            ))}
          </div>
        </div>

        {cfg && (
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4">
            {(cfg.ranks || cfg.rankFree) && (
              <div><label className={labelCls}>{t('rec_rank')} *</label>
                {cfg.ranks
                  ? <select name="rank" required className={inputCls}><option value="">{t('rec_choose')}</option>{cfg.ranks.map(r => <option key={r}>{r}</option>)}</select>
                  : <input name="rank" required placeholder={cfg.rankPh} className={inputCls} />}
              </div>
            )}
            {cfg.modes && (
              <div><label className={labelCls}>{t('rec_mode')} *</label>
                <select name="mode" required className={inputCls}><option value="">{t('rec_choose')}</option>{cfg.modes.map(m => <option key={m}>{m}</option>)}</select>
              </div>
            )}
            {cfg.roles && (
              <div><label className={labelCls}>{t('rec_role')} *</label>
                <select name="role" required className={inputCls}><option value="">{t('rec_choose')}</option>{cfg.roles.map(r => <option key={r}>{r}</option>)}</select>
              </div>
            )}
            {cfg.mains && (
              <div><label className={labelCls}>{t('rec_main')} *</label>
                <select name="main" required className={inputCls}><option value="">{t('rec_choose')}</option>{cfg.mains.map(m => <option key={m}>{m}</option>)}</select>
              </div>
            )}
            {cfg.champs && (
              <div><label className={labelCls}>{t('rec_champs')}</label><input name="champs" placeholder="Ex: Yasuo, Lee Sin, Jinx" className={inputCls} /></div>
            )}
            {!cfg.modes && !cfg.palmares && (
              <div><label className={labelCls}>{t('rec_tracker')} *</label><input name="tracker" required placeholder={cfg.trackerPh} className={inputCls} /></div>
            )}
            {(cfg.modes || cfg.palmares) && (
              <div><label className={labelCls}>{t('rec_gameid')} *</label><input name="gameid" required placeholder={cfg.gameIdPh} className={inputCls} /></div>
            )}
            {cfg.palmares && (
              <div><label className={labelCls}>{t('rec_palmares')}</label><textarea name="palmares" rows="2" placeholder="..." className={inputCls} /></div>
            )}
          </div>
        )}

        <div><label className={labelCls}>{t('rec_exp')}</label><input name="experience" placeholder="Ex: Ex-Team X, tournois..." className={inputCls} /></div>
        <div><label className={labelCls}>{t('rec_dispo')} *</label>
          <select name="dispo" required className={inputCls}>
            <option value="">{t('rec_choose')}</option>
            <option>{t('rec_dispo_1')}</option><option>{t('rec_dispo_2')}</option>
            <option>{t('rec_dispo_3')}</option><option>{t('rec_dispo_4')}</option>
          </select>
        </div>
        <div><label className={labelCls}>{t('rec_motiv')} *</label><textarea name="motivation" rows="3" required placeholder="..." className={inputCls} /></div>
        <div><label className={labelCls}>{t('rec_video')}</label><input name="video" placeholder="https://youtube.com/..." className={inputCls} /></div>

        <button type="submit" disabled={sending} className="w-full mt-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 font-black disabled:opacity-60 flex items-center justify-center gap-2">
          <Send size={18} /> {sending ? t('rec_sending') : t('rec_send')}
        </button>
      </form>
    </div>
  )
}
